import { StyleSheet, Text, View } from 'react-native';

export type ChartDataPoint = { label: string; value: number; color?: string };

type Props = {
  data: ChartDataPoint[];
  maxValue?: number;
  barHeight?: number;
  showValues?: boolean;
};

export default function StatsChart({ data, maxValue, barHeight = 18, showValues = true }: Props) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <View>
      {data.map((point, i) => (
        <View key={point.label} style={[styles.row, i < data.length - 1 && styles.rowGap]}>
          <Text style={styles.label} numberOfLines={1}>
            {point.label}
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.bar,
                {
                  flex: point.value / max,
                  height: barHeight,
                  backgroundColor: point.color ?? '#6366f1',
                },
              ]}
            />
            <View style={{ flex: 1 - point.value / max }} />
          </View>
          {showValues && (
            <Text style={styles.value}>{point.value}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowGap: {
    marginBottom: 8,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    width: 36,
    textAlign: 'right',
    marginRight: 8,
  },
  barTrack: {
    flex: 1,
    flexDirection: 'row',
  },
  bar: {
    borderRadius: 3,
    minWidth: 2,
  },
  value: {
    color: '#64748b',
    fontSize: 11,
    width: 24,
    textAlign: 'right',
    marginLeft: 6,
  },
});
