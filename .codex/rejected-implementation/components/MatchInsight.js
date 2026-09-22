import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme';
import { getMatchLabel } from '../utils/matching';

export function MatchInsight({ breakdown: b, compact = false, onPress }) {
  if (!b) return null;
  const caution = b.ineligible || b.practical.status === 'unmet' || b.eligibility.unknown || b.practical.status === 'unknown';
  return <TouchableOpacity disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={onPress ? 'See preference fit and eligibility details' : undefined} style={[s.card, compact && s.compact]}>
    <View style={s.row}><Text style={s.eyebrow}>YOUR FIT</Text><Text style={s.coverage}>{b.coverage.answered}/{b.coverage.total} profile basics</Text></View>
    <View style={s.row}><Text style={s.score}>{b.total === null ? 'Let’s explore' : `${b.total}% preference fit`}</Text></View>
    <Text style={[s.status, caution && s.caution]}>{getMatchLabel(b)}</Text>
    {!compact && <>
      <Text style={s.note}>Preference fit, not your chance of acceptance.</Text>
      <View style={s.divider} />
      <Text style={s.label}>Eligibility</Text>
      <Text style={s.body}>{b.ineligible ? b.ineligibleReason : b.eligibility.unknown ? 'Some requirements still need confirmation.' : 'Your answers meet the requirements checked here. Verify the full listing before applying.'}</Text>
      <Text style={s.label}>Practical limits</Text>
      <Text style={s.body}>{b.practical.issues.length ? b.practical.issues.join(' ') : b.practical.checks.length ? b.practical.checks.join(' ') : 'No conflict found with the limits you shared.'}</Text>
      {b.checksNeeded.length > 0 && <View style={s.checks}><Text style={s.label}>Before you apply</Text>{[...new Set(b.checksNeeded)].map(t => <Text key={t} style={s.body}>• {t}</Text>)}</View>}
    </>}
    {compact && b.checksNeeded.length > 0 && <Text numberOfLines={2} style={s.note}>{b.checksNeeded[0]}</Text>}
    {onPress && <Text style={s.link}>See why →</Text>}
  </TouchableOpacity>;
}

export function MatchInsightModal({ visible, onClose, breakdown: b }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={s.backdrop}><View style={s.sheet}>
      <View style={[s.row, {padding:20}]}><Text style={s.title}>Understand your match</Text><TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close match details" style={s.close}><Text style={s.link}>Done</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={{padding:20,paddingTop:0}}>
        <MatchInsight breakdown={b} />
        {b && <><Text style={s.label}>Preferences compared</Text>{b.categories.map(c=><View key={c.key} style={s.category}><Text style={s.label}>{c.label}</Text><Text style={s.body}>{c.detail}</Text><Text style={s.note}>{c.points === null ? 'Not included until confirmed' : `${Math.round(c.points / c.max * 100)}% alignment · weight ${Math.round(c.max)}`}</Text></View>)}
          <Text style={s.label}>Application materials</Text><Text style={s.body}>{b.readiness.total ? `${b.readiness.ready} of ${b.readiness.total} listed materials ready` : 'See the application checklist for requirements.'}</Text><Text style={s.note}>Materials do not change your preference fit.</Text>
          {b.readiness.tasks.map(t=><Text key={t.key} style={s.body}>{t.ready?'✓':'○'} {t.label}</Text>)}</>}
      </ScrollView>
    </View></View>
  </Modal>;
}
const s=StyleSheet.create({
 card:{padding:16,borderWidth:1,borderColor:Colors.border,borderRadius:16,backgroundColor:Colors.surface,gap:8},compact:{padding:12},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'},eyebrow:{fontSize:12,letterSpacing:1,fontWeight:'700',color:Colors.accent},coverage:{fontSize:12,color:Colors.textSecondary},score:{fontSize:22,fontWeight:'700',color:Colors.textPrimary},status:{fontSize:14,fontWeight:'600',color:'#166534'},caution:{color:'#92400E'},note:{fontSize:13,color:Colors.textSecondary,lineHeight:19},body:{fontSize:15,color:Colors.textPrimary,lineHeight:22},label:{fontSize:15,fontWeight:'600',color:Colors.textPrimary,marginTop:8},link:{fontSize:14,fontWeight:'600',color:Colors.accent},divider:{height:1,backgroundColor:Colors.border,marginVertical:8},checks:{backgroundColor:'#FFFBEB',padding:12,borderRadius:8,gap:6},backdrop:{flex:1,backgroundColor:Colors.overlay,justifyContent:'center',padding:20},sheet:{maxHeight:'90%',width:'100%',maxWidth:540,alignSelf:'center',borderRadius:20,backgroundColor:Colors.surface},title:{fontSize:18,fontWeight:'700',color:Colors.textPrimary},close:{minHeight:44,minWidth:44,justifyContent:'center'},category:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:Colors.border,gap:4}
});
