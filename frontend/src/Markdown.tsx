import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from './theme';

/**
 * Lightweight markdown renderer for lesson theory.
 * Supports: # h1, ## h2, ### h3, **bold**, *italic*, `inline code`, ```lang code blocks```, paragraphs, list items.
 */
export default function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <View style={{ gap: 14 }}>
      {blocks.map((b, i) => {
        if (b.type === 'h1') return <Text key={i} style={styles.h1}>{b.text}</Text>;
        if (b.type === 'h2') return <Text key={i} style={styles.h2}>{b.text}</Text>;
        if (b.type === 'h3') return <Text key={i} style={styles.h3}>{b.text}</Text>;
        if (b.type === 'code') return <CodeBlock key={i} code={b.text} lang={b.lang} />;
        if (b.type === 'list') {
          return (
            <View key={i} style={{ gap: 6 }}>
              {b.items!.map((it, j) => (
                <View key={j} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.body}>{renderInline(it)}</Text>
                </View>
              ))}
            </View>
          );
        }
        return <Text key={i} style={styles.body}>{renderInline(b.text)}</Text>;
      })}
    </View>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <View style={styles.codeWrap} testID="code-block">
      {lang ? <Text style={styles.codeLang}>{lang}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={styles.code}>{highlightCode(code, lang)}</Text>
      </ScrollView>
    </View>
  );
}

type Block = { type: 'h1' | 'h2' | 'h3' | 'p' | 'code' | 'list'; text: string; lang?: string; items?: string[] };

function parseBlocks(src: string): Block[] {
  const lines = src.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join(' ') });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'list', text: '', items: list });
      list = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      flushPara();
      flushList();
      const lang = line.replace(/```/g, '').trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', text: codeLines.join('\n'), lang });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      flushPara();
      flushList();
      blocks.push({ type: 'h1', text: line.slice(2) });
    } else if (line.startsWith('## ')) {
      flushPara();
      flushList();
      blocks.push({ type: 'h2', text: line.slice(3) });
    } else if (line.startsWith('### ')) {
      flushPara();
      flushList();
      blocks.push({ type: 'h3', text: line.slice(4) });
    } else if (line.match(/^\s*[-*]\s+/)) {
      flushPara();
      list.push(line.replace(/^\s*[-*]\s+/, ''));
    } else if (line.trim() === '') {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
    i++;
  }
  flushPara();
  flushList();
  return blocks;
}

// Render inline markdown to a node tree
function renderInline(text: string): React.ReactNode {
  // Tokens: **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(<Text key={key++} style={{ fontWeight: '800', color: colors.textPrimary }}>{tok.slice(2, -2)}</Text>);
    } else if (tok.startsWith('*')) {
      parts.push(<Text key={key++} style={{ fontStyle: 'italic' }}>{tok.slice(1, -1)}</Text>);
    } else if (tok.startsWith('`')) {
      parts.push(
        <Text key={key++} style={styles.inlineCode}>{tok.slice(1, -1)}</Text>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

// Very light syntax highlighting that returns a single Text with nested spans.
function highlightCode(code: string, _lang?: string): React.ReactNode {
  const keywords = /\b(def|return|if|else|elif|for|while|in|class|new|public|private|static|void|int|double|String|boolean|char|let|const|var|function|=>|import|from|print|console|System|true|false|null|None|True|False)\b/g;
  const strings = /(["'`])(?:\\.|(?!\1).)*\1/g;
  const comments = /(\/\/[^\n]*|#[^\n]*)/g;

  type Span = { start: number; end: number; color: string };
  const spans: Span[] = [];
  let mm: RegExpExecArray | null;
  while ((mm = comments.exec(code)) !== null) spans.push({ start: mm.index, end: mm.index + mm[0].length, color: colors.syntax.comment });
  while ((mm = strings.exec(code)) !== null) spans.push({ start: mm.index, end: mm.index + mm[0].length, color: colors.syntax.string });
  while ((mm = keywords.exec(code)) !== null) spans.push({ start: mm.index, end: mm.index + mm[0].length, color: colors.syntax.keyword });
  spans.sort((a, b) => a.start - b.start);

  // Remove overlaps (keep earlier)
  const filtered: Span[] = [];
  let cursor = 0;
  for (const s of spans) {
    if (s.start >= cursor) {
      filtered.push(s);
      cursor = s.end;
    }
  }

  const out: React.ReactNode[] = [];
  let pos = 0;
  let key = 0;
  for (const s of filtered) {
    if (s.start > pos) out.push(<Text key={key++} style={{ color: '#E6EDF3' }}>{code.slice(pos, s.start)}</Text>);
    out.push(<Text key={key++} style={{ color: s.color }}>{code.slice(s.start, s.end)}</Text>);
    pos = s.end;
  }
  if (pos < code.length) out.push(<Text key={key++} style={{ color: '#E6EDF3' }}>{code.slice(pos)}</Text>);
  return out;
}

const styles = StyleSheet.create({
  h1: { color: colors.textPrimary, fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  h2: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  h3: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 26 },
  listItem: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
  bullet: { color: colors.brand, fontSize: 16, lineHeight: 26 },
  inlineCode: {
    fontFamily: 'Courier', backgroundColor: '#1E293B', color: '#A5D6FF',
    paddingHorizontal: 6, borderRadius: 4, fontSize: 14,
  },
  codeWrap: {
    backgroundColor: '#0B0F15', borderColor: colors.surfaceElevated, borderWidth: 1,
    borderRadius: 16, padding: 14, marginVertical: 4,
  },
  codeLang: { color: colors.textDisabled, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' },
  code: { fontFamily: 'Courier', color: '#E6EDF3', fontSize: 14, lineHeight: 22 },
});
