const fs=require('fs'); const root=__dirname+'/interny-site-review/interny-app/';
const edit=(file,fn)=>{const p=root+file;const s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,fn(s));};
edit('screens/HomeScreen.js',s=>s
 .replace('  ActivityIndicator,','  useWindowDimensions,\n  ActivityIndicator,')
 .replace('export default function HomeScreen({ navigation }) {','export default function HomeScreen({ navigation }) {\n const {width} = useWindowDimensions();\n const columns = width >= 1200 ? 2 : 1;')
 .replace('  style={[styles.card, closed','  dataSet={{ui:"internship-card"}}\n  style={[styles.card, closed')
 .replace(' const listHeader = useMemo(() => (\n   <>',' const listHeader = useMemo(() => (\n   <View dataSet={{ui:"home-overview"}}>')
 .replace('   </>\n ), [','   </View>\n ), [')
 .replaceAll('<View style={styles.section}>','<View dataSet={{ui:"home-section"}} style={styles.section}>')
 .replace('<View dataSet={{ui:"home-section"}} style={styles.section}>\n         <SectionHeader title="Today', '<View dataSet={{ui:"today-section"}} style={styles.section}>\n         <SectionHeader title="Today')
 .replace('<View dataSet={{ui:"home-section"}} style={styles.section}>\n         <SectionHeader\n           title="Closing soon"','<View dataSet={{ui:"closing-section"}} style={styles.section}>\n         <SectionHeader\n           title="Closing soon"')
 .replace('<View style={styles.personalizationBanner}>','<View dataSet={{ui:"personalization"}} style={styles.personalizationBanner}>')
 .replace('     <FlatList\n','     <FlatList\n       key={columns}\n       numColumns={columns}\n       columnWrapperStyle={columns > 1 ? {gap:20,paddingHorizontal:16} : undefined}\n')
 .replace('numberOfLines={1}>{item.role}', 'numberOfLines={2}>{item.role}')
 .replace('style={styles.headerTitle} numberOfLines={1}', 'style={styles.headerTitle} numberOfLines={2}')
 .replace('removeClippedSubviews={true}', 'removeClippedSubviews={false}')
);
edit('screens/SearchScreen.js',s=>s
 .replace('<View style={styles.categoryGrid}>','<View dataSet={{ui:"category-grid"}} style={styles.categoryGrid}>')
 .replace('style={[styles.categoryCard,','dataSet={{ui:"category-card"}} style={[styles.categoryCard,')
 .replace('style={[styles.resultRow,','dataSet={{ui:"result-row"}} style={[styles.resultRow,')
 .replace('<View style={styles.resultText}>','<View dataSet={{ui:"result-text"}} style={styles.resultText}>')
 .replace('<View style={styles.resultMeta}>','<View dataSet={{ui:"result-meta"}} style={styles.resultMeta}>')
 .replace('<View style={styles.modalSheet}>','<View dataSet={{ui:"filter-dialog"}} style={styles.modalSheet}>')
 .replace('<ScrollView showsVerticalScrollIndicator={false}>','<ScrollView dataSet={{ui:"filter-options"}} showsVerticalScrollIndicator={false}>')
 .replace('numberOfLines={1}>{item.role}', 'numberOfLines={2}>{item.role}')
 .replace('removeClippedSubviews={true}', 'removeClippedSubviews={false}')
);
edit('screens/TrackerScreen.js',s=>s
 .replace('<View style={styles.column}>','<View dataSet={{ui:"pipeline-column"}} style={styles.column}>')
 .replace('<View style={styles.similarSection}>','<View dataSet={{ui:"pipeline-similar"}} style={styles.similarSection}>')
 .replace('<ScrollView style={styles.scroll}', '<ScrollView dataSet={{ui:"pipeline"}} style={styles.scroll}')
);
edit('screens/DetailScreen.js',s=>s
 .replace('<ScrollView\n ref={tourScrollRef}', '<ScrollView\n dataSet={{ui:"detail-grid"}}\n ref={tourScrollRef}')
 .replace('<View style={styles.hero}>','<View dataSet={{ui:"detail-summary"}} style={styles.hero}>')
 .replace(' <Divider />\n\n {/* Tab bar */}', ' <View dataSet={{ui:"detail-content"}}>\n <Divider />\n\n {/* Tab bar */}')
 .replace('<View style={styles.tabContent}>{tabContent[activeTab]}</View>', '<View style={styles.tabContent}>{tabContent[activeTab]}</View>\n </View>')
 .replace('<View style={styles.applyBar}>','<View dataSet={{ui:"detail-actions"}} style={styles.applyBar}>')
);
for(const file of fs.readdirSync(root+'screens').filter(x=>x.endsWith('.js'))){
 edit('screens/'+file,s=>s.replaceAll('<SafeAreaView style={styles.modalSafe}', '<SafeAreaView dataSet={{ui:"form-dialog"}} style={styles.modalSafe}')
 .replaceAll('<SafeAreaView style={styles.notesSafe}', '<SafeAreaView dataSet={{ui:"form-dialog"}} style={styles.notesSafe}')
 .replaceAll('<SafeAreaView style={styles.stateModalSafe}', '<SafeAreaView dataSet={{ui:"form-dialog"}} style={styles.stateModalSafe}')
 .replaceAll('<View style={styles.pickerSheet}>', '<View dataSet={{ui:"picker-dialog"}} style={styles.pickerSheet}>'));
}
