import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getShareStatus, SentShare, ShareStatus } from '../api/shares';

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const STATUS_LABEL: Record<ShareStatus, string> = {
  pending: "hasn't watched yet",
  watch_only: 'watched · no reaction',
  awaiting_reaction: 'watching now…',
  reacted: 'reacted to your clip',
};

export default function HomeScreen({
  sentShares,
  onSend,
  onViewReplay,
  onOpenLink,
  onLookupReplay,
}: {
  sentShares: SentShare[];
  onSend: () => void;
  onViewReplay: (share: { shareId: string; videoId: string; title: string }) => void;
  onOpenLink: () => void;
  onLookupReplay: () => void;
}) {
  const [statusByShareId, setStatusByShareId] = useState<Record<string, ShareStatus>>({});
  const [refreshing, setRefreshing] = useState(false);

  const refreshStatuses = useCallback(async (shares: SentShare[]) => {
    const entries = await Promise.all(
      shares.map(async share => {
        try {
          const info = await getShareStatus(share.shareId);
          return [share.shareId, info.status] as const;
        } catch {
          return [share.shareId, 'pending'] as const;
        }
      }),
    );
    setStatusByShareId(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    refreshStatuses(sentShares);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentShares.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStatuses(sentShares);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.heading}>Alongside</Text>

      <FlatList
        style={styles.list}
        contentContainerStyle={sentShares.length === 0 && styles.emptyContainer}
        data={sentShares}
        keyExtractor={item => item.shareId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4de8c7"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Nothing sent yet — tap + to send your first clip.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = statusByShareId[item.shareId];
          const ready = status === 'reacted';
          return (
            <Pressable
              style={styles.row}
              disabled={!ready}
              onPress={() =>
                onViewReplay({
                  shareId: item.shareId,
                  videoId: item.videoId,
                  title: item.title,
                })
              }>
              <View style={[styles.thumbWrap, ready && styles.thumbWrapReady]}>
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.rowStatus, ready && styles.rowStatusReady]}>
                  {status ? STATUS_LABEL[status] : 'checking…'}
                </Text>
              </View>
              <Text style={styles.rowTime}>{timeAgo(item.createdAt)}</Text>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={onSend}>
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>

      <View style={styles.devLinks}>
        <Pressable onPress={onOpenLink}>
          <Text style={styles.devLinkText}>Dev: open a link as the recipient →</Text>
        </Pressable>
        <Pressable onPress={onLookupReplay} style={styles.devLinkSpacing}>
          <Text style={styles.devLinkText}>Dev: view a replay by share id →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0d10' },
  heading: {
    color: '#edeef0',
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  list: { flex: 1 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: '#5a6066', fontSize: 14.5, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapReady: { borderColor: '#4de8c7' },
  thumb: { width: '100%', height: '100%', borderRadius: 22, backgroundColor: '#15181c' },
  rowText: { flex: 1 },
  rowTitle: { color: '#edeef0', fontSize: 14.5, fontWeight: '700' },
  rowStatus: { color: '#6d726d', fontSize: 12.5, marginTop: 2 },
  rowStatusReady: { color: '#4de8c7' },
  rowTime: { color: '#5a6066', fontSize: 11.5, fontFamily: 'monospace' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff4433',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#ff4433',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: { color: '#fff', fontSize: 30, fontWeight: '300', marginTop: -2 },
  devLinks: { paddingHorizontal: 20, paddingBottom: 14, alignItems: 'center' },
  devLinkText: { color: '#5a6066', fontSize: 11.5 },
  devLinkSpacing: { marginTop: 6 },
});
