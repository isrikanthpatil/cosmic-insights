import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Download } from 'lucide-react-native';
import { showToast } from '@/utils/toast';
import { tap } from '@/utils/haptics';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Renders a report's HTML in a WebView and offers a Save/Share PDF action
 * (expo-print generates the PDF on-device; expo-sharing opens the share sheet).
 * The web build uses ReportViewer.web.tsx so these native modules aren't bundled
 * for web.
 */
export default function ReportViewer({ html, fileName }: { html: string; fileName: string }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  const sharePdf = async () => {
    if (busy) return;
    tap();
    setBusy(true);
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: fileName,
          UTI: 'com.adobe.pdf',
        });
      } else {
        showToast(t('viewer.sharingUnavailable'), 'info');
      }
    } catch {
      showToast(t('viewer.pdfFailed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={styles.btn}
          onPress={sharePdf}
          disabled={busy}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('viewer.savePdfLabel')}
        >
          {busy ? (
            <ActivityIndicator color="#0B0B1A" />
          ) : (
            <>
              <Download size={18} color="#0B0B1A" />
              <Text style={styles.btnText}>{t('viewer.savePdf')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF7EF' },
  web: { flex: 1, backgroundColor: '#FBF7EF' },
  bar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#0E0B22',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,200,126,0.25)',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8C87E',
    borderRadius: 24,
    paddingVertical: 14,
  },
  btnText: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#0B0B1A' },
});
