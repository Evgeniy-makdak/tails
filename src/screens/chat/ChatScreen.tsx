import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLiveChat } from '../../chat/useLiveChat';
import type { UiChatMessage } from '../../chat/types';
import { TailioBlob } from '../../components/brand/TailioMark';
import { features } from '../../config/features';
import { useActivePet, useAppStore } from '../../store/useAppStore';
import { colors, radius, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../types/navigation';
import { pickChatCamera, pickChatDocument, pickChatGallery, type ChatAttachment } from '../../utils/chatAttachments';
import { startVoiceCapture } from '../../utils/voiceInput';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

const OPERATOR_REPLIES = [
  'Мы получили ваш вопрос и уже ищем оператора для ответа…',
  'Мы ценим ваше время! Если вы отправите подробное описание вашего вопроса, то мы ответим вам сразу после того как появится свободный оператор.',
  'Специалист уже в очереди. Пока можете приложить фото или документы — так ответ будет точнее.',
  'Оператор скоро подключится. Если ситуация срочная — откройте карту и активируйте SOS, чтобы связаться со службой помощи.',
  'Спасибо за обращение! Ветеринарный специалист ответит, как только освободится. Мы сохранили ваш запрос в чате.',
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatScreen({ navigation, route }: Props) {
  const pet = useActivePet();
  const currentEmail = useAppStore((s) => s.currentEmail);
  const ownerName = useAppStore((s) => s.ownerName);
  const ownerCity = useAppStore((s) => s.ownerCity);
  const mode = route.params?.mode ?? 'tailio';
  const isHelp = mode === 'help';
  const liveEnabled = features.chatLive;

  const welcomeText = useMemo(
    () =>
      isHelp
        ? `Вы на связи со службой помощи Tailio. Расскажите, что случилось с ${pet.name} — специалист подключится к диалогу.`
        : `Добро пожаловать в Tailio ✨ Теперь мы вместе будем следить за состоянием и безопасностью ${pet.name}.\n\nЯ уже проверил его состояние 👀 Сейчас он спокоен, а показатели в пределах нормы.`,
    [isHelp, pet.name],
  );

  const welcome = useMemo<UiChatMessage[]>(
    () => [{ id: 'welcome', role: 'bot', text: welcomeText }],
    [welcomeText],
  );

  const live = useLiveChat({
    enabled: liveEnabled,
    email: currentEmail,
    ownerName,
    ownerCity,
    pet: {
      id: pet.id,
      name: pet.name,
      kind: pet.kind,
      breed: pet.breed,
      sex: pet.sex,
      birthDate: pet.birthDate,
      collarId: pet.collarId,
    },
    welcomeText,
  });

  const [demoMessages, setDemoMessages] = useState<UiChatMessage[]>(welcome);
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoTyping, setDemoTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [userQuestionCount, setUserQuestionCount] = useState(0);

  const feedRef = useRef<ScrollView>(null);
  const replyTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const voiceStopRef = useRef<(() => void) | null>(null);

  const messages = liveEnabled ? live.messages : demoMessages;
  const typing = liveEnabled ? live.typing : demoTyping;

  useEffect(() => {
    if (!liveEnabled) {
      setDemoMessages(welcome);
      setUserQuestionCount(0);
    }
  }, [welcome, liveEnabled]);

  useEffect(() => {
    return () => {
      replyTimers.current.forEach(clearTimeout);
      voiceStopRef.current?.();
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => feedRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages, typing]);

  const scheduleOperatorReply = (nextCount: number) => {
    setDemoTyping(true);
    const delay = 2000 + Math.floor(Math.random() * 1000);
    const timer = setTimeout(() => {
      const reply =
        OPERATOR_REPLIES[(nextCount - 1) % OPERATOR_REPLIES.length] ??
        'Мы получили ваш вопрос и уже ищем оператора для ответа…';
      setDemoMessages((prev) => [...prev, { id: uid(), role: 'bot', text: reply }]);
      setDemoTyping(false);
    }, delay);
    replyTimers.current.push(timer);
  };

  const sendText = (raw: string, attachment?: ChatAttachment) => {
    const text = raw.trim();
    if (!text && !attachment) {
      return;
    }

    setMenuOpen(false);
    setDraft('');

    const body =
      text || (attachment?.kind === 'image' ? 'Прикрепил(а) изображение' : `Прикрепил(а) файл: ${attachment?.name}`);

    if (liveEnabled) {
      const payload = attachment
        ? `${body}${attachment.kind === 'image' ? ' [фото]' : ` [файл: ${attachment.name}]`}`
        : body;
      const ok = live.sendText(payload);
      if (!ok) {
        live.setMessages((prev) => [
          ...prev,
          { id: uid(), role: 'system', text: 'Не удалось отправить. Проверьте связь с сервером.' },
        ]);
      }
      live.onDraftChange('');
      return;
    }

    const nextCount = userQuestionCount + 1;
    setUserQuestionCount(nextCount);
    setDemoMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: 'user',
        text: body,
        attachment,
      },
    ]);
    scheduleOperatorReply(nextCount);
  };

  const onSend = () => sendText(draft);

  const onChip = (label: string) => {
    if (typing || listening) {
      return;
    }
    sendText(label);
  };

  const onAttach = async (kind: 'camera' | 'gallery' | 'file') => {
    setMenuOpen(false);
    const attachment =
      kind === 'camera' ? await pickChatCamera() : kind === 'gallery' ? await pickChatGallery() : await pickChatDocument();
    if (!attachment) {
      return;
    }
    sendText(attachment.kind === 'image' ? 'Прикрепил(а) изображение' : `Прикрепил(а) файл: ${attachment.name}`, attachment);
  };

  const onMic = async () => {
    if (typing) {
      return;
    }
    if (listening) {
      voiceStopRef.current?.();
      voiceStopRef.current = null;
      setListening(false);
      return;
    }

    setMenuOpen(false);
    setListening(true);
    const session = startVoiceCapture({
      onPartial: (text) => setDraft(text),
    });
    voiceStopRef.current = session.stop;
    const result = await session.promise;
    voiceStopRef.current = null;
    setListening(false);
    if (result?.transcript) {
      setDraft(result.transcript);
    }
  };

  const onChangeDraft = (value: string) => {
    setDraft(value);
    if (liveEnabled) {
      live.onDraftChange(value);
    }
  };

  const canSend = draft.trim().length > 0;
  const statusLabel =
    liveEnabled && live.status === 'connecting'
      ? 'Подключение…'
      : liveEnabled && live.status === 'offline'
        ? 'Нет связи'
        : liveEnabled && live.conversation?.status === 'waiting'
          ? 'Ищем консультанта…'
          : liveEnabled && live.conversation?.status === 'active'
            ? 'Консультант на связи'
            : null;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{isHelp ? 'Служба помощи' : 'Tailio Чат'}</Text>
            {statusLabel ? <Text style={styles.status}>{statusLabel}</Text> : null}
          </View>
          <View style={{ width: 24 }} />
        </View>

        {liveEnabled && live.error ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{live.error}</Text>
          </View>
        ) : null}

        <ScrollView
          ref={feedRef}
          style={styles.feedScroll}
          contentContainerStyle={styles.feed}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.day}>Сегодня</Text>
          {messages.map((message) => {
            if (message.role === 'system') {
              return (
                <Text key={message.id} style={styles.systemText}>
                  {message.text}
                </Text>
              );
            }
            if (message.role === 'bot') {
              return (
                <View key={message.id} style={styles.msg}>
                  <TailioBlob size={36} />
                  <View style={styles.bubble}>
                    <Text style={styles.sender}>{isHelp || liveEnabled ? 'Специалист' : 'Tailio'}</Text>
                    <MessageBody text={message.text} />
                  </View>
                </View>
              );
            }
            return (
              <View key={message.id} style={styles.userRow}>
                <View style={styles.userBubble}>
                  {message.attachment?.kind === 'image' ? (
                    <Image source={{ uri: message.attachment.uri }} style={styles.attachImage} />
                  ) : null}
                  {message.attachment?.kind === 'file' ? (
                    <View style={styles.fileChip}>
                      <Ionicons name="document-outline" size={16} color={colors.purple} />
                      <Text style={styles.fileName} numberOfLines={1}>
                        {message.attachment.name}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.userText}>{message.text}</Text>
                </View>
              </View>
            );
          })}
          {typing ? (
            <View style={styles.msg}>
              <TailioBlob size={36} />
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={colors.purple} />
                <Text style={styles.typingText}>оператор печатает ответ…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          {!isHelp ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chips}
              keyboardShouldPersistTaps="handled"
            >
              <Chip label="Есть ли повод для беспокойства?" onPress={() => onChip('Есть ли повод для беспокойства?')} />
              <Chip label={`Где сейчас ${pet.name}?`} onPress={() => onChip(`Где сейчас ${pet.name}?`)} />
            </ScrollView>
          ) : null}

          {menuOpen ? (
            <View style={styles.menu}>
              <MenuItem icon="camera-outline" label="Камера" onPress={() => onAttach('camera')} />
              <MenuItem icon="image-outline" label="Фото" onPress={() => onAttach('gallery')} />
              <MenuItem icon="document-outline" label="Файл" onPress={() => onAttach('file')} />
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <Pressable
              style={[styles.round, menuOpen && styles.roundActive]}
              onPress={() => setMenuOpen((value) => !value)}
              accessibilityLabel="Вложения"
            >
              <Ionicons name="attach" size={18} color={colors.white} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={onChangeDraft}
              placeholder={listening ? 'Слушаю…' : `Спросить про ${pet.name}`}
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              editable={!listening}
              onSubmitEditing={onSend}
              returnKeyType="send"
            />
            {canSend ? (
              <Pressable style={[styles.round, styles.sendBtn]} onPress={onSend} accessibilityLabel="Отправить">
                <Ionicons name="arrow-up" size={18} color={colors.white} />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.round, styles.micBtn, listening && styles.micListening]}
                onPress={onMic}
                accessibilityLabel="Голосовой ввод"
              >
                <Ionicons name={listening ? 'stop' : 'mic'} size={18} color={colors.white} />
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBody({ text }: { text: string }) {
  const parts = text.split(/(спокоен|нормы|норме)/gi);
  return (
    <Text style={styles.text}>
      {parts.map((part, index) => {
        const highlight = /^(спокоен|нормы|норме)$/i.test(part);
        return (
          <Text key={`${part}-${index}`} style={highlight ? styles.ok : undefined}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.chip} onPress={onPress}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={18} color={colors.ink} />
      <Text style={styles.menuItemText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    ...type.subtitle,
    color: colors.ink,
  },
  status: {
    ...type.caption,
    color: colors.purple,
    marginTop: 2,
  },
  banner: {
    marginHorizontal: spacing.xl,
    marginBottom: 8,
    backgroundColor: '#FDECEC',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerText: {
    ...type.caption,
    color: colors.red,
  },
  feedScroll: {
    flex: 1,
    minHeight: 0,
  },
  feed: {
    padding: spacing.xl,
    gap: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  composer: {
    flexShrink: 0,
    backgroundColor: colors.paper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 8,
    zIndex: 2,
  },
  day: {
    ...type.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  systemText: {
    ...type.caption,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  msg: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bubble: {
    flex: 1,
    gap: 6,
  },
  sender: {
    ...type.subtitle,
    color: colors.ink,
  },
  text: {
    ...type.body,
    color: colors.inkSoft,
  },
  ok: {
    color: colors.green,
    fontFamily: 'Inter_600SemiBold',
  },
  userRow: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: colors.purpleSoft,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  userText: {
    ...type.body,
    color: colors.ink,
  },
  attachImage: {
    width: 180,
    height: 140,
    borderRadius: 12,
    backgroundColor: colors.linenDeep,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.paper,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fileName: {
    ...type.caption,
    color: colors.ink,
    flexShrink: 1,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typingText: {
    ...type.caption,
    color: colors.muted,
  },
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chips: {
    paddingHorizontal: spacing.xl,
    gap: 8,
    paddingBottom: 10,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: colors.lavender,
    borderWidth: 1,
    borderColor: '#D9D0F5',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    ...type.caption,
    color: colors.inkSoft,
  },
  menu: {
    marginHorizontal: spacing.xl,
    marginBottom: 8,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 6,
    paddingHorizontal: 4,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignSelf: 'flex-start',
    minWidth: 150,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemText: {
    ...type.body,
    color: colors.ink,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundActive: {
    backgroundColor: colors.ink,
  },
  micBtn: {
    backgroundColor: colors.purple,
  },
  micListening: {
    backgroundColor: colors.red,
  },
  sendBtn: {
    backgroundColor: colors.purple,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 22,
    backgroundColor: '#F3F3F5',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.ink,
  },
});
