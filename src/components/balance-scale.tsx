import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const WIDTH = 240;
const HEIGHT = 168;
const BEAM_Y = 44;
const BEAM_W = 176;
const BEAM_H = 3;
const PILLAR_H = 74;
const BASE_W = 96;
const BASE_H = 8;
const PAN_W = 58;
const PAN_H = 22;
const STRING_H = 24;

/**
 * 天平（暂时只是摆设）：空盘、静态，不参与换算。
 * 全部用普通 View 拼，不引 SVG。
 */
export function BalanceScale() {
  const theme = useTheme();
  const color = theme.textSecondary;
  const centerX = WIDTH / 2;
  const panTop = BEAM_Y + BEAM_H + STRING_H;
  const beamEnds = [centerX - BEAM_W / 2, centerX + BEAM_W / 2];

  return (
    <View style={styles.wrapper} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* 底座 */}
      <View
        style={[
          styles.base,
          { left: (WIDTH - BASE_W) / 2, top: BEAM_Y + PILLAR_H + 4, backgroundColor: color },
        ]}
      />
      {/* 立柱 */}
      <View
        style={[
          styles.pillar,
          { left: centerX - 1, top: BEAM_Y, height: PILLAR_H + 8, backgroundColor: color },
        ]}
      />
      {/* 横梁 */}
      <View
        style={[
          styles.beam,
          { left: (WIDTH - BEAM_W) / 2, top: BEAM_Y, backgroundColor: color },
        ]}
      />
      {/* 支点 */}
      <View style={[styles.pivot, { left: centerX - 7, top: BEAM_Y - 11, borderColor: color }]} />

      {/* 吊绳 */}
      {beamEnds.map((x, i) => (
        <View
          key={`string-${i}`}
          style={[
            styles.string,
            { left: x - 0.75, top: BEAM_Y + BEAM_H, height: STRING_H, backgroundColor: color },
          ]}
        />
      ))}

      {/* 托盘 */}
      {beamEnds.map((x, i) => (
        <View
          key={`pan-${i}`}
          style={[styles.pan, { left: x - PAN_W / 2, top: panTop, borderColor: color }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: WIDTH,
    height: HEIGHT,
  },
  base: {
    position: 'absolute',
    width: BASE_W,
    height: BASE_H,
    borderRadius: BASE_H / 2,
    opacity: 0.35,
  },
  pillar: {
    position: 'absolute',
    width: 2,
    opacity: 0.5,
  },
  beam: {
    position: 'absolute',
    width: BEAM_W,
    height: BEAM_H,
    borderRadius: BEAM_H / 2,
    opacity: 0.75,
  },
  pivot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    opacity: 0.75,
  },
  string: {
    position: 'absolute',
    width: 1.5,
    opacity: 0.4,
  },
  pan: {
    position: 'absolute',
    width: PAN_W,
    height: PAN_H,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: PAN_H,
    borderBottomRightRadius: PAN_H,
    opacity: 0.75,
  },
});
