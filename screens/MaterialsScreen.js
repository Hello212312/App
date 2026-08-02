// screens/MaterialsScreen.js
// Application materials vault + Recommender manager.
// New: essay has app/question picker; transcript has file upload; recommenders tag applications.

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { INTERNSHIPS } from '../data';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';

// ─── MATERIAL KINDS ──────────────────────────────────────────────────────────

const MATERIAL_KINDS = [
  { key: 'resume',       label: 'Resume',           icon: 'document-text-outline' },
  { key: 'transcript',   label: 'Transcript',        icon: 'school-outline' },
  { key: 'essay',        label: 'Essay / Statement', icon: 'create-outline' },
  { key: 'short_answer', label: 'Short Answer',      icon: 'chatbox-ellipses-outline' },
  { key: 'portfolio',    label: 'Portfolio link',    icon: 'link-outline' },
  { key: 'other',        label: 'Other',             icon: 'folder-outline' },
];

const KIND_COLORS = {
  resume:       { bg: Colors.tagSTEM,          fg: Colors.tagSTEMText },
  transcript:   { bg: Colors.tagBusiness,      fg: Colors.tagBusinessText },
  essay:        { bg: Colors.tagArt,           fg: Colors.tagArtText },
  short_answer: { bg: Colors.tagEngineering,   fg: Colors.tagEngineeringText },
  portfolio:    { bg: Colors.tagMedicine,      fg: Colors.tagMedicineText },
  other:        { bg: Colors.surfaceSecondary, fg: Colors.textSecondary },
};

// Common application essay prompts (shown as quick-select when kind === 'essay')
const ESSAY_QUESTIONS = [
  { key: 'why_interest', label: 'Why are you interested in this program?' },
  { key: 'goals',        label: 'What are your academic/career goals?' },
  { key: 'experience',   label: 'Describe a relevant experience.' },
  { key: 'leadership',   label: 'Tell us about a leadership experience.' },
  { key: 'challenge',    label: 'Describe a challenge you overcame.' },
  { key: 'contribution', label: 'How will you contribute to our community?' },
  { key: 'diversity',    label: 'How does your background shape your perspective?' },
  { key: 'stem',         label: 'Why are you passionate about STEM/your field?' },
  { key: 'custom',       label: 'Custom question…' },
];

const REC_STATUSES = [
  { key: 'asked',     label: 'Asked' },
  { key: 'agreed',    label: 'Agreed' },
  { key: 'submitted', label: 'Submitted' },
];

// ─── APP PICKER ──────────────────────────────────────────────────────────────
// A scrollable modal that lets users pick one or more internships.

const AppPickerModal = ({ visible, onClose, onSelect, selectedIds = [], title = 'Select application' }) => {
  const { applicationList } = useUser();
  const apps = useMemo(() => {
    return (applicationList || []).map((a) => {
      const meta = a.meta || {};
      const internship = INTERNSHIPS.find((i) => i.id === (meta.id || a.id));
      return { id: meta.id || a.id, role: meta.role || internship?.role || '-', company: meta.company || internship?.company || '-' };
    });
  }, [applicationList]);

  const [tempSelected, setTempSelected] = useState(selectedIds);

  React.useEffect(() => {
    if (visible) setTempSelected(selectedIds);
  }, [visible]);

  const toggle = (id) => {
    setTempSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={() => { onSelect(tempSelected); onClose(); }}>
            <Text style={styles.modalSave}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.screenPadding }}>
          {apps.length === 0 ? (
            <Text style={styles.emptyHint}>Save internships first. They will appear here for tagging.</Text>
          ) : (
            apps.map((app) => {
              const sel = tempSelected.includes(app.id);
              return (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.appPickerRow, sel && styles.appPickerRowActive]}
                  onPress={() => toggle(app.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.appPickerCheck}>
                    {sel && <Text style={styles.appPickerCheckMark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.appPickerRole}>{app.role}</Text>
                    <Text style={styles.appPickerCompany}>{app.company}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ─── MATERIAL EDITOR MODAL ───────────────────────────────────────────────────

const MaterialEditor = ({ visible, material, onClose, onSave }) => {
  const [kind,        setKind]        = useState(material?.kind || 'resume');
  const [title,       setTitle]       = useState(material?.title || '');
  const [content,     setContent]     = useState(material?.content || '');
  const [appIds,      setAppIds]      = useState(material?.appIds || []);
  const [questionKey, setQuestionKey] = useState(material?.questionKey || '');
  const [customQ,     setCustomQ]     = useState(material?.customQuestion || '');
  const [fileUri,     setFileUri]     = useState(material?.fileUri || '');
  const [appPickerOpen, setAppPickerOpen] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setKind(material?.kind || 'resume');
      setTitle(material?.title || '');
      setContent(material?.content || '');
      setAppIds(material?.appIds || []);
      setQuestionKey(material?.questionKey || '');
      setCustomQ(material?.customQuestion || '');
      setFileUri(material?.fileUri || '');
    }
  }, [visible, material]);

  const { applicationList } = useUser();

  const selectedAppLabels = useMemo(() => {
    return appIds.map((id) => {
      const a = (applicationList || []).find((a) => (a.meta?.id || a.id) === id);
      return a ? (a.meta?.company || id) : id;
    }).join(', ');
  }, [appIds, applicationList]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      kind,
      title: title.trim(),
      content,
      appIds,
      questionKey,
      customQuestion: questionKey === 'custom' ? customQ : '',
      fileUri,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{material ? 'Edit material' : 'New material'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={!title.trim()}>
            <Text style={[styles.modalSave, !title.trim() && { color: Colors.textDisabled }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">

          {/* Type picker */}
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.kindGrid}>
            {MATERIAL_KINDS.map((k) => {
              const active = kind === k.key;
              return (
                <TouchableOpacity
                  key={k.key}
                  onPress={() => setKind(k.key)}
                  style={[styles.kindChip, active && styles.kindChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.kindChipText, active && styles.kindChipTextActive]}>{k.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Application tag (which internship is this for?) */}
          <Text style={styles.fieldLabel}>For which application?</Text>
          <TouchableOpacity style={styles.appPickerTrigger} onPress={() => setAppPickerOpen(true)} activeOpacity={0.8}>
            <Text style={appIds.length > 0 ? styles.appPickerValue : styles.appPickerPlaceholder}>
              {appIds.length > 0 ? selectedAppLabels : 'Tap to select (optional)'}
            </Text>
            <Text style={styles.appPickerChevron}>›</Text>
          </TouchableOpacity>

          {/* Essay-specific: question picker */}
          {kind === 'essay' && (
            <>
              <Text style={styles.fieldLabel}>Essay question / prompt</Text>
              <View style={styles.kindGrid}>
                {ESSAY_QUESTIONS.map((q) => {
                  const active = questionKey === q.key;
                  return (
                    <TouchableOpacity
                      key={q.key}
                      onPress={() => setQuestionKey(q.key)}
                      style={[styles.kindChip, active && styles.kindChipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.kindChipText, active && styles.kindChipTextActive]}>{q.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {questionKey === 'custom' && (
                <>
                  <Text style={styles.fieldLabel}>Custom question</Text>
                  <TextInput
                    style={styles.input}
                    value={customQ}
                    onChangeText={setCustomQ}
                    placeholder="Paste the exact essay question here…"
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                  />
                </>
              )}
            </>
          )}

          {/* Transcript: file URI / upload path */}
          {kind === 'transcript' && (
            <>
              <Text style={styles.fieldLabel}>File path / link</Text>
              <TextInput
                style={styles.input}
                value={fileUri}
                onChangeText={setFileUri}
                placeholder="Paste a file URL or path (e.g. from Files app)"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.uploadHint}>
                Tip: In Files or iCloud Drive, long-press your transcript PDF → Share → Copy Link, then paste above.
              </Text>
            </>
          )}

          {/* Title */}
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={kind === 'essay' ? 'e.g. Why Research Essay (500w)' : kind === 'transcript' ? 'e.g. Official Transcript (Spring 2025)' : 'e.g. Resume v3'}
            placeholderTextColor={Colors.textTertiary}
          />

          {/* Content (not for transcript) */}
          {kind !== 'transcript' && (
            <>
              <Text style={styles.fieldLabel}>
                {kind === 'essay' ? 'Essay text' : kind === 'portfolio' ? 'Link' : 'Content / notes'}
              </Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={content}
                onChangeText={setContent}
                placeholder={
                  kind === 'essay'
                    ? 'Paste your essay here…'
                    : kind === 'portfolio'
                    ? 'https://…'
                    : 'Paste content or notes…'
                }
                placeholderTextColor={Colors.textTertiary}
                multiline
                textAlignVertical="top"
              />
            </>
          )}

          <View style={{ height: Spacing[8] }} />
        </ScrollView>

        <AppPickerModal
          visible={appPickerOpen}
          onClose={() => setAppPickerOpen(false)}
          onSelect={setAppIds}
          selectedIds={appIds}
        />
      </SafeAreaView>
    </Modal>
  );
};

// ─── RECOMMENDER EDITOR ──────────────────────────────────────────────────────

const RecommenderEditor = ({ visible, rec, onClose, onSave }) => {
  const [name,   setName]   = useState(rec?.name || '');
  const [role,   setRole]   = useState(rec?.role || '');
  const [email,  setEmail]  = useState(rec?.email || '');
  const [status, setStatus] = useState(rec?.status || 'asked');
  const [appIds, setAppIds] = useState(rec?.appIds || []);
  const [appPickerOpen, setAppPickerOpen] = useState(false);

  const { applicationList } = useUser();

  React.useEffect(() => {
    if (visible) {
      setName(rec?.name || '');
      setRole(rec?.role || '');
      setEmail(rec?.email || '');
      setStatus(rec?.status || 'asked');
      setAppIds(rec?.appIds || []);
    }
  }, [visible, rec]);

  const selectedAppLabels = useMemo(() => {
    return appIds.map((id) => {
      const a = (applicationList || []).find((a) => (a.meta?.id || a.id) === id);
      return a ? (a.meta?.company || id) : id;
    }).join(', ');
  }, [appIds, applicationList]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), role: role.trim(), email: email.trim(), status, appIds });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{rec ? 'Edit recommender' : 'New recommender'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={!name.trim()}>
            <Text style={[styles.modalSave, !name.trim() && { color: Colors.textDisabled }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Ms. Patel" placeholderTextColor={Colors.textTertiary} />

          <Text style={styles.fieldLabel}>Role / subject</Text>
          <TextInput style={styles.input} value={role} onChangeText={setRole} placeholder="e.g. AP Biology teacher" placeholderTextColor={Colors.textTertiary} />

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="[email protected]"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Which applications?</Text>
          <TouchableOpacity style={styles.appPickerTrigger} onPress={() => setAppPickerOpen(true)} activeOpacity={0.8}>
            <Text style={appIds.length > 0 ? styles.appPickerValue : styles.appPickerPlaceholder}>
              {appIds.length > 0 ? selectedAppLabels : 'Tap to select (optional)'}
            </Text>
            <Text style={styles.appPickerChevron}>›</Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Status</Text>
          <View style={styles.kindGrid}>
            {REC_STATUSES.map((s) => {
              const active = status === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setStatus(s.key)}
                  style={[styles.kindChip, active && styles.kindChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.kindChipText, active && styles.kindChipTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: Spacing[8] }} />
        </ScrollView>

        <AppPickerModal
          visible={appPickerOpen}
          onClose={() => setAppPickerOpen(false)}
          onSelect={setAppIds}
          selectedIds={appIds}
          title="Select applications"
        />
      </SafeAreaView>
    </Modal>
  );
};

// ─── MATERIAL CARD ───────────────────────────────────────────────────────────

const MaterialCard = ({ m, onPress, onDelete }) => {
  const colors  = KIND_COLORS[m.kind] || KIND_COLORS.other;
  const kindMeta = MATERIAL_KINDS.find((k) => k.key === m.kind);
  const kindLabel = kindMeta?.label || 'Other';
  const questionLabel = m.questionKey && m.questionKey !== 'custom'
    ? ESSAY_QUESTIONS.find((q) => q.key === m.questionKey)?.label
    : m.customQuestion || null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={[styles.cardIcon, { backgroundColor: colors.bg }]}>
        <Ionicons name={kindMeta?.icon || 'folder-outline'} size={18} color={colors.fg} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>{m.title}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {kindLabel}
          {m.appIds?.length > 0 ? ` · ${m.appIds.length} app${m.appIds.length > 1 ? 's' : ''}` : ''}
          {m.kind === 'transcript' && m.fileUri ? ' · file attached' : ''}
          {m.kind !== 'transcript' && m.content ? ` · ${m.content.length} chars` : ''}
        </Text>
        {questionLabel && (
          <Text style={styles.cardQ} numberOfLines={1}>{questionLabel}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.cardDelete}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ─── RECOMMENDER CARD ────────────────────────────────────────────────────────

const RecommenderCard = ({ r, onPress, onDelete }) => {
  const STATUS_STYLE = {
    asked:     { bg: Colors.warningLight, fg: Colors.warning },
    agreed:    { bg: Colors.accentLight,  fg: Colors.accent },
    submitted: { bg: Colors.successLight, fg: Colors.success },
  };
  const style = STATUS_STYLE[r.status] || STATUS_STYLE.asked;
  const statusLabel = REC_STATUSES.find((s) => s.key === r.status)?.label || r.status;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={[styles.cardIcon, { backgroundColor: Colors.accentLight }]}>
        <Text style={[styles.cardIconText, { color: Colors.accent }]}>{r.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>{r.name}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {r.role || r.email || '-'}
          {r.appIds?.length > 0 ? ` · ${r.appIds.length} app${r.appIds.length > 1 ? 's' : ''}` : ''}
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: style.bg }]}>
        <Text style={[styles.statusPillText, { color: style.fg }]}>{statusLabel}</Text>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: Spacing[2] }}>
        <Text style={styles.cardDelete}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

const EmptyTab = ({ title, sub, onAdd }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySub}>{sub}</Text>
    <TouchableOpacity style={styles.emptyBtn} onPress={onAdd} activeOpacity={0.85}>
      <Text style={styles.emptyBtnText}>Add now</Text>
    </TouchableOpacity>
  </View>
);

// ─── MATERIALS SCREEN ────────────────────────────────────────────────────────

export default function MaterialsScreen({ navigation }) {
  const {
    materials, addMaterial, updateMaterial, removeMaterial,
    recommenders, addRecommender, updateRecommender, removeRecommender,
  } = useUser();

  const [tab,           setTab]           = useState('materials');
  const [matEditorOpen, setMatEditorOpen] = useState(false);
  const [editingMat,    setEditingMat]    = useState(null);
  const [recEditorOpen, setRecEditorOpen] = useState(false);
  const [editingRec,    setEditingRec]    = useState(null);

  const openNewMat  = () => { setEditingMat(null);  setMatEditorOpen(true); };
  const openEditMat = (m) => { setEditingMat(m);    setMatEditorOpen(true); };
  const handleSaveMat = (data) => {
    if (editingMat) updateMaterial(editingMat.id, data);
    else addMaterial(data);
  };
  const handleDeleteMat = (id) => {
    Alert.alert('Delete material', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeMaterial(id) },
    ]);
  };

  const openNewRec  = () => { setEditingRec(null);  setRecEditorOpen(true); };
  const openEditRec = (r) => { setEditingRec(r);    setRecEditorOpen(true); };
  const handleSaveRec = (data) => {
    if (editingRec) updateRecommender(editingRec.id, data);
    else addRecommender(data);
  };
  const handleDeleteRec = (id) => {
    Alert.alert('Delete recommender', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeRecommender(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        {navigation?.canGoBack?.() && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginRight: Spacing[2] }}
          >
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Materials</Text>
        <TouchableOpacity style={styles.addBtn} onPress={tab === 'materials' ? openNewMat : openNewRec} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {[
          ['materials',   `Materials (${materials.length})`],
          ['recommenders', `Recommenders (${recommenders.length})`],
        ].map(([val, label]) => (
          <TouchableOpacity
            key={val}
            style={[styles.tabChip, tab === val && styles.tabChipActive]}
            onPress={() => setTab(val)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === val && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Premium: essay review quick link */}
      <TouchableOpacity
        style={styles.essayReviewBanner}
        onPress={() => navigation?.navigate('EssayReview')}
        activeOpacity={0.85}
      >
        <Text style={styles.essayReviewBannerText}>Get an essay reviewed</Text>
        <Text style={styles.essayReviewBannerArrow}>›</Text>
      </TouchableOpacity>

      {/* Content */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tab === 'materials' ? (
          materials.length === 0 ? (
            <EmptyTab
              title="Build your application kit"
              sub="Save resumes, transcripts, essays, and short answers. Tag them to specific applications."
              onAdd={openNewMat}
            />
          ) : (
            materials.map((m) => (
              <MaterialCard key={m.id} m={m} onPress={() => openEditMat(m)} onDelete={() => handleDeleteMat(m.id)} />
            ))
          )
        ) : recommenders.length === 0 ? (
          <EmptyTab
            title="Track your recommenders"
            sub="Add teachers or mentors writing letters. Tag each one to the specific programs they're covering."
            onAdd={openNewRec}
          />
        ) : (
          recommenders.map((r) => (
            <RecommenderCard key={r.id} r={r} onPress={() => openEditRec(r)} onDelete={() => handleDeleteRec(r.id)} />
          ))
        )}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      <MaterialEditor
        visible={matEditorOpen}
        material={editingMat}
        onClose={() => setMatEditorOpen(false)}
        onSave={handleSaveMat}
      />
      <RecommenderEditor
        visible={recEditorOpen}
        rec={editingRec}
        onClose={() => setRecEditorOpen(false)}
        onSave={handleSaveRec}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  essayReviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing[3],
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.accentMuted,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  essayReviewBannerText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.accent,
  },
  essayReviewBannerArrow: {
    fontSize: Typography.size.lg,
    color: Colors.accent,
  },
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  backChevron: { fontSize: 30, color: Colors.textPrimary, lineHeight: 32 },
  addBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.accentLight,
  },
  addBtnText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.accent },

  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.screenPadding, gap: Spacing[2], marginBottom: Spacing[3] },
  tabChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radii.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white, fontWeight: Typography.weight.semibold },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.screenPadding },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[3],
    ...Shadows.card,
  },
  cardIcon: { width: 42, height: 42, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  cardIconText: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  cardText: { flex: 1 },
  cardTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, marginBottom: 1 },
  cardSub: { fontSize: Typography.size.xs, color: Colors.textTertiary },
  cardQ: { fontSize: Typography.size.xs, color: Colors.accent, marginTop: 2 },
  cardDelete: { fontSize: 22, color: Colors.textTertiary, paddingHorizontal: Spacing[1] },

  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full },
  statusPillText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },

  // Empty
  empty: { alignItems: 'center', paddingVertical: Spacing[10], paddingHorizontal: Spacing[4] },
  emptyTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing[2], textAlign: 'center' },
  emptySub: { fontSize: Typography.size.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: Typography.size.sm * 1.6, marginBottom: Spacing[5] },
  emptyBtn: { backgroundColor: Colors.accent, borderRadius: Radii.lg, paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], ...Shadows.elevated },
  emptyBtnText: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.white },
  emptyHint: { fontSize: Typography.size.sm, color: Colors.textTertiary, textAlign: 'center', fontStyle: 'italic', paddingTop: Spacing[6] },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing[3],
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  modalCancel: { fontSize: Typography.size.md, color: Colors.textSecondary },
  modalTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  modalSave: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.accent },
  modalScroll: { flex: 1, paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing[4] },

  fieldLabel: {
    fontSize: Typography.size.xs, fontWeight: Typography.weight.medium, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.4,
    marginBottom: Spacing[2], marginTop: Spacing[4],
  },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[3],
    fontSize: Typography.size.md, color: Colors.textPrimary,
  },
  textarea: { minHeight: 180, textAlignVertical: 'top' },
  kindGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  kindChip: {
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radii.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  kindChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  kindChipText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
  kindChipTextActive: { color: Colors.white, fontWeight: Typography.weight.semibold },

  // App picker trigger
  appPickerTrigger: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[3],
    gap: Spacing[2],
  },
  appPickerValue: { flex: 1, fontSize: Typography.size.md, color: Colors.textPrimary },
  appPickerPlaceholder: { flex: 1, fontSize: Typography.size.md, color: Colors.textTertiary },
  appPickerChevron: { fontSize: 20, color: Colors.textTertiary },

  // App picker modal rows
  appPickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  appPickerRowActive: { backgroundColor: Colors.accentLight, borderRadius: Radii.md, paddingHorizontal: Spacing[2] },
  appPickerCheck: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  appPickerCheckMark: { fontSize: 13, color: Colors.accent, fontWeight: Typography.weight.bold },
  appPickerRole: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  appPickerCompany: { fontSize: Typography.size.sm, color: Colors.textSecondary },

  uploadHint: { fontSize: Typography.size.xs, color: Colors.textTertiary, marginTop: Spacing[2], fontStyle: 'italic', lineHeight: Typography.size.xs * 1.6 },
});