import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MovieFilter, DEFAULT_FILTER, isFilterActive } from '../types';
import { useTheme } from '../hooks/useTheme';

export { MovieFilter, DEFAULT_FILTER, isFilterActive };

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
  'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
  'Thriller', 'War', 'Western',
];

const DECADES = [1960, 1970, 1980, 1990, 2000, 2010, 2020];
const DECADE_LABELS: Record<number, string> = {
  1960: '60s', 1970: '70s', 1980: '80s', 1990: '90s',
  2000: '2000s', 2010: '2010s', 2020: '2020s',
};

const MIN_RATINGS = [
  { label: 'Any', value: 0 },
  { label: '6+', value: 6 },
  { label: '7+', value: 7 },
  { label: '8+', value: 8 },
];

const PROVIDERS: { label: string; id: number }[] = [
  { label: 'Netflix', id: 8 },
  { label: 'Prime', id: 9 },
  { label: 'Disney+', id: 337 },
  { label: 'Hulu', id: 15 },
  { label: 'Max', id: 1899 },
  { label: 'Apple TV+', id: 350 },
  { label: 'Peacock', id: 386 },
  { label: 'Paramount+', id: 531 },
];

const LANGUAGES: { label: string; code: string }[] = [
  { label: 'English', code: 'en' },
  { label: 'Spanish', code: 'es' },
  { label: 'French', code: 'fr' },
  { label: 'Japanese', code: 'ja' },
  { label: 'Korean', code: 'ko' },
  { label: 'Hindi', code: 'hi' },
  { label: 'Portuguese', code: 'pt' },
  { label: 'Italian', code: 'it' },
  { label: 'German', code: 'de' },
  { label: 'Mandarin', code: 'zh' },
];

const ACCENT = '#6366f1';

type Props = {
  visible: boolean;
  filter: MovieFilter;
  onChange: (f: MovieFilter) => void;
  onClose: () => void;
};

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export default function FilterSheet({ visible, filter, onChange, onClose }: Props) {
  const c = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.surface }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.divider }]}>
          <Pressable
            onPress={() => onChange(DEFAULT_FILTER)}
            hitSlop={12}
          >
            <Text style={[styles.resetText, { color: isFilterActive(filter) ? '#ef4444' : c.textFaint }]}>
              Reset
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Filter</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.doneText, { color: ACCENT }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Streaming service */}
          <Text style={[styles.sectionLabel, { color: c.textDim }]}>Streaming Service</Text>
          <Text style={[styles.sectionNote, { color: c.textFaint }]}>
            Provider data is region-approximate (US). Results vary.
          </Text>
          <View style={styles.chipRow}>
            {PROVIDERS.map(({ label, id }) => {
              const on = filter.providers.includes(id);
              return (
                <Chip
                  key={id}
                  label={label}
                  on={on}
                  onPress={() => onChange({ ...filter, providers: toggle(filter.providers, id) })}
                  c={c}
                />
              );
            })}
          </View>

          {/* Genre */}
          <Text style={[styles.sectionLabel, { color: c.textDim }]}>Genre</Text>
          <View style={styles.chipRow}>
            {GENRES.map((g) => (
              <Chip
                key={g}
                label={g}
                on={filter.genres.includes(g)}
                onPress={() => onChange({ ...filter, genres: toggle(filter.genres, g) })}
                c={c}
              />
            ))}
          </View>

          {/* Language */}
          <Text style={[styles.sectionLabel, { color: c.textDim }]}>Language</Text>
          <View style={styles.chipRow}>
            {LANGUAGES.map(({ label, code }) => {
              const on = filter.language === code;
              return (
                <Chip
                  key={code}
                  label={label}
                  on={on}
                  // Tap again to deselect (single-select)
                  onPress={() => onChange({ ...filter, language: on ? '' : code })}
                  c={c}
                />
              );
            })}
          </View>

          {/* Decade */}
          <Text style={[styles.sectionLabel, { color: c.textDim }]}>Decade</Text>
          <View style={styles.chipRow}>
            {DECADES.map((d) => (
              <Chip
                key={d}
                label={DECADE_LABELS[d]}
                on={filter.decades.includes(d)}
                onPress={() => onChange({ ...filter, decades: toggle(filter.decades, d) })}
                c={c}
              />
            ))}
          </View>

          {/* Min TMDB Rating */}
          <Text style={[styles.sectionLabel, { color: c.textDim }]}>Min TMDB Rating</Text>
          <View style={styles.chipRow}>
            {MIN_RATINGS.map(({ label, value }) => (
              <Chip
                key={value}
                label={label}
                on={filter.minRating === value}
                onPress={() => onChange({ ...filter, minRating: value })}
                c={c}
              />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function Chip({
  label, on, onPress, c,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  c: any;
}) {
  return (
    <Pressable
      style={[styles.chip, on ? styles.chipOn : [styles.chipOff, { borderColor: c.border }]]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, { color: on ? '#fff' : c.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  resetText: { fontSize: 15, fontWeight: '500' },
  doneText: { fontSize: 15, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  sectionNote: {
    fontSize: 11,
    marginBottom: 10,
    marginTop: -2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipOn: { backgroundColor: ACCENT },
  chipOff: { borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
});
