import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Download } from 'lucide-react-native';

/**
 * Web version of the report viewer — no native modules. Shows the report in an
 * iframe and prints (Save-as-PDF) via a popup window.
 */
export default function ReportViewer({ html, fileName }: { html: string; fileName: string }) {
  const printPdf = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.title = fileName;
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <View style={styles.container}>
      {/* @ts-ignore — raw iframe is valid on web (react-native-web renders to DOM). */}
      <iframe srcDoc={html} title="report" style={{ flex: 1, border: 'none', background: '#FBF7EF' }} />
      <View style={styles.bar}>
        <TouchableOpacity style={styles.btn} onPress={printPdf} activeOpacity={0.85}>
          <Download size={18} color="#0B0B1A" />
          <Text style={styles.btnText}>Print / Save as PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF7EF' },
  bar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
