const fs=require('fs');const root='interny-site-review/interny-app/';
const f=root+'screens/OnboardingScreen.js';let s=fs.readFileSync(f,'utf8');
s=s.replace('<View style={styles.stepContainer}>','<View dataSet={{ui:"onboarding-step"}} style={styles.stepContainer}>');
s=s.replaceAll('<View style={styles.stepContainer}>','<View dataSet={{ui:"onboarding-step"}} style={styles.stepContainer}>');
s=s.replaceAll('<View style={styles.gradeList}>','<View dataSet={{ui:"onboarding-options"}} style={styles.gradeList}>');
s=s.replaceAll('<Text style={styles.stepHeadline}>','<Text accessibilityRole="header" dataSet={{ui:"onboarding-title"}} style={styles.stepHeadline}>');
s=s.replaceAll('<Text style={styles.stepSubtitle}>','<Text dataSet={{ui:"onboarding-description"}} style={styles.stepSubtitle}>');
s=s.replace('<View style={styles.welcomeIconBox}>','<View dataSet={{ui:"welcome-mark"}} style={styles.welcomeIconBox}>');
s=s.replace('The easiest way for high school students to find and apply to internships that fit their interests and schedule.','Build a shortlist around your interests, check the requirements, and keep your applications in one place.');
s=s.replace('<SafeAreaView dataSet={{screen:"onboarding"}} style={styles.safe}>',`<div className="onboarding-layout">
 <aside className="onboarding-guide" aria-label="Setup progress">
 <p className="setup-kicker">YOUR INTERNY PROFILE</p><h1>A place to start.<br/><span>A plan to follow.</span></h1>
 <p className="setup-intro">Tell us what matters to you. We’ll use it to help you find opportunities that fit.</p>
 <ol>{[{label:'Getting started',detail:'Welcome and introduction',end:2},{label:'About you',detail:'Name, grade, and interests',end:5},{label:'Your preferences',detail:'School, location, and priorities',end:7},{label:'Application profile',detail:'Academics and readiness',end:10}].map((section,i,all)=>{const start=i===0?1:all[i-1].end+1;const active=step>=start&&step<=section.end;return <li key={section.label} aria-current={active?'step':undefined} className={step>section.end?'complete':''}><span className="setup-number">{step>section.end?'✓':String(i+1).padStart(2,'0')}</span><div><strong>{section.label}</strong><small>{section.detail}</small></div></li>})}</ol>
 <p className="setup-note">Your profile can be updated any time.<br/>Saved data stays in this browser.</p>
 </aside>
 <SafeAreaView dataSet={{screen:"onboarding",step:String(step)}} style={styles.safe}>`);
s=s.replace(' ref={scrollRef}\n style={styles.scroll}',' ref={scrollRef}\n dataSet={{ui:"onboarding-scroll"}}\n style={styles.scroll}');
s=s.replace(' </SafeAreaView>\n );\n}', ' </SafeAreaView>\n </div>\n );\n}');
s=s.replace("{step === TOTAL_STEPS ? 'Get started' : 'Continue'}","{step === TOTAL_STEPS ? 'Find my internships' : step === 1 ? 'Build my profile' : 'Continue'}");
fs.writeFileSync(f,s);
const d=root+'web/DiscoveryWorkspace.js';s=fs.readFileSync(d,'utf8').replace('Find something <span>worth pursuing.</span>','Your internship shortlist').replace('YOUR NEXT MOVE','FOR YOU').replace('name="sparkles-outline"','name="compass-outline"');fs.writeFileSync(d,s);
