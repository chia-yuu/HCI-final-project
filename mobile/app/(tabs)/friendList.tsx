import PageTemplate from '@/components/page-template';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function FriendListScreen() {
  const friends = [
    { name: '張旨憲', status: 'focusing' },
    { name: '吳佳璇', status: 'relaxing' },
    { name: '林芸馨', status: '02:01:00', highlight: true },
    { name: '林雲蓁', status: 'focusing' },
    { name: '郭玉辰', status: 'relaxing' },
    { name: '郭指安', status: 'relaxing' },
  ];

  return (
    <PageTemplate title="好友列表" selectedTab="friend">
      <View style={styles.container}>
        {friends.map((f, index) => (
          <View
            key={index}
            style={[
              styles.row,
              f.highlight && styles.highlightRow
            ]}
          >
            {/* 固定寬度名字 */}
            <View style={[styles.fixedBox, styles.nameBox]}>
              <Text style={styles.nameText} numberOfLines={1}>
                {f.name}
              </Text>
            </View>

            {/* 固定寬度狀態 */}
            <View style={[styles.fixedBox, styles.statusBox]}>
              <Text style={styles.statusText} numberOfLines={1}>
                {f.status}
              </Text>
            </View>

            {/* 只有 relaxing 才顯示 emoji */}
            {f.status === "relaxing" && (
              <TouchableOpacity onPress={() => console.log(f.name + " pressed")}>
                <Text style={styles.emoji}>🔔</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </PageTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    width: '100%',
    paddingHorizontal: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  highlightRow: {
    backgroundColor: '#d1d5db',
    borderWidth: 1,
    borderColor: '#000',
  },

  fixedBox: {
    backgroundColor: '#d1d5db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nameBox: {
    width: 100,
    marginRight: 16,
  },
  statusBox: {
    width: 120,
    marginRight: 16,
  },

  nameText: {
    fontSize: 18,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 16,
    fontStyle: 'italic',
  },

  emoji: {
    fontSize: 26,
  },
});
