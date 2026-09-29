/**
 * Mentor profile content, batch 2 of 3.
 *
 * Generated from the existing `mentor.bio_ro` / `title_ro` — every fact is traceable to
 * the source biography. Word counts follow the client spec of 21/09/2026:
 * short 25-40, about 80-120, kogaion 60-100, quote 25-60, expertise 3-6 tags.
 *
 * `quote` is a first-person restatement of the source bio, not an authentic quote —
 * the client asked for it to be produced by shortening the existing text. Replace with
 * real quotes when the client supplies them.
 */
export interface MentorProfileContent {
	slug: string;
	role: string;
	short: string;
	about: string;
	kogaion: string;
	quote: string;
	expertise: string[];
}

export const mentorProfileBatch2: MentorProfileContent[] = [
	{
		slug: 'doru-tatar',
		role: 'Inventator și inginer constructor',
		short:
			'Inginer constructor și inventator cu peste 15 brevete de invenție în șase țări, Doru Tătar aduce în taberele Kogaion felul de a gândi al inventatorului: de la o idee până la o soluție care chiar funcționează.',
		about:
			'Doru Tătar este un inginer constructor și inventator român, cunoscut pentru contribuțiile sale majore în siderurgie și metalurgie. Deține peste 15 brevete de invenție, obținute atât în România, cât și în Statele Unite ale Americii, Germania, Japonia, Mexic și Belgia. Munca sa a fost premiată cu numeroase distincții la târgurile internaționale de inventică, iar invențiile sale au fost implementate cu succes în mari unități industriale și în uzine metalurgice importante din Europa și America. Este activ în comunitatea inginerilor și a fost primul președinte al Asociației Creatorilor în Tehnică, militând pentru protejarea drepturilor inventatorilor și optimizarea legislației din domeniu.',
		kogaion:
			'La Kogaion, Doru Tătar lucrează cu gândirea de inventator: cum apare o idee, cum se verifică și cum ajunge o soluție cu adevărat în uz producție. Pentru copii și adulți, asta înseamnă să înveți să pui întrebări, să păstrezi un caiet de observații și să înțelegi de ce un lucru merge sau nu merge. Experiența lui în siderurgie și metalurgie oferă un exemplu concret despre ce înseamnă perseverența, rigoarea și consecințele alegerilor tehnice.',
		quote:
			'Am peste 15 brevete de invenție, obținute în șase țări, și am văzut invențiile mele puse în funcțiune în uzine din Europa și America. Am fost primul președinte al Asociației Creatorilor în Tehnică, pentru că drepturile inventatorilor trebuie apărate prin lege, nu doar prin vorbe bune.',
		expertise: [
			'Inginerie',
			'Siderurgie și metalurgie',
			'Invenții și brevete',
			'Gândire inventivă',
			'Proiecte tehnice'
		]
	},
	{
		slug: 'eliza-galan',
		role: 'Trainer mindfulness și poliglot',
		short:
			'Profesoară de limbi străine timp de nouă ani și vorbitoare fluentă în șase limbi, Eliza Galan predă mindfulness copiilor cu o tehnică discretă: observarea respirației și a senzațiilor, pentru mai multă atenție și mai multă înțelegere.',
		about:
			'Eliza Galan este licențiată în Litere, secția Franceză-Engleză a Universității A.I. Cuza din Iași, unde a aprofundat și literatura francofonă. A lucrat nouă ani ca profesoară de limbi străine la gimnaziu și vorbește fluent șase limbi: engleză, franceză, italiană, spaniolă, portugheză și greacă. De la cunoașterea exterioară a trecut la cunoașterea interioară: prin observarea respirației și a senzațiilor a ajuns să se cunoască mai bine, ceea ce i-a îmbunătățit și comunicarea din exterior. A descoperit acolo o atenție mai mare la ceilalți, înțelegere în spatele aparențelor și un nivel de empatie crescut. A absolvit International Buddhist Studies College din Bangkok.',
		kogaion:
			'În activitățile de mindfulness de la Kogaion, Eliza lucrează cu respirația și cu senzațiile ca punct de pornire pentru copii și adolescente. Echipajul devine un loc sigur în care fiecare observă ce se întâmplă în corp și în minte înainte să înțeleagă ce simte. Nouă ani de predare a limbilor străine îi aduc o metodă firească de a explica lucrurile pe înțelesul vârstei, iar formatul de trainer oferă structura de care grupul are nevoie ca practica să devină obișnuință.',
		quote:
			'Din cunoașterea exterioară am trecut la cunoașterea interioară. Observarea respirației și a senzațiilor m-a ajutat să mă cunosc mai bine, iar asta mi-a îmbunătățit și comunicarea din afară: am atenție mai mare la ceilalți și înțelegere în spatele aparențelor.',
		expertise: ['Mindfulness', 'Autocunoaștere', 'Comunicare', 'Învățarea limbilor', 'Meditație']
	},
	{
		slug: 'flavian-glont',
		role: 'Mentor speedcubing și matematică',
		short:
			'Câștigător la Românii au Talent în 2015 și la Britain\u2019s Got Talent în 2016, Flavian Glonț îi ajută pe copii să rezolve cubul Rubik ca pe un sport al minții, antrenat prin mișcări rapide și memorie.',
		about:
			'Flavian Glonț a absolvit Colegiul Național Dinicu Golescu, cu specializarea matematică-informatică intensiv, și este student la Politehnica, la Facultatea de Antreprenoriat, Inginerie și Managementul Afacerilor. A devenit cunoscut în 2015, când a câștigat showul Românii au Talent ca membru al echipei SPEEDCUBING, iar în 2016 a participat la Britain\u2019s Got Talent. Cifrele sale de rating l-au plasat pe primul loc în topul celor mai cunoscuți speedcubi ai Planetei, iar titlurile de multiplu campion național completează un palmares construit prin antrenament intens. Motto-ul său, Imposibilul este Posibil, spune aproape tot despre felul în care lucrează cu copiii.',
		kogaion:
			'În activitățile de la Kogaion, Flavian folosește rezolvarea cubului Rubik ca pe un sport al minții, nu ca pe o demonstrație de viteză. Copiii exersează algoritmi, memorie și viziune în spațiu, iar ei înșiși urmăresc timpii proprii și își văd clar progresul. De la un singur pas se ajunge la secvențe lungi, exact ca în orice învățare: greșeala devine informație, iar reluarea construiește automatismul. Experiența lui de concurent îi permite să știe unde se blochează un începător și să îl ajute să continue.',
		quote:
			'Imposibilul este Posibil. Am vrut să împărtășesc și altora ce am găsit în cubul Rubik: nu e un joc de noroc, ci un sport al minții care se antrenează ca unul. Fiecare secundă se câștigă sau se pierde, iar copiii simt asta imediat.',
		expertise: ['Speedcubing', 'Cubul Rubik', 'Matematică', 'Memorie', 'Gândire rapidă']
	},
	{
		slug: 'florin-munteanu',
		role: 'Mentor în Știința Complexității',
		short:
			'Peste 35 de ani de experiență în promovarea Științei Complexității în România, profesorul Florin Munteanu îi ajută pe copii și părinți să privească știința ca pe o disciplină a întrebărilor, nu doar a răspunsurilor.',
		about:
			'Florin Munteanu este profesor, cercetător și explorator, cu peste 35 de ani dedicați promovării în România a paradigmei Complexității. Este doctor în Științe, specializat în aplicațiile Științei Complexității în inginerie, econofizică, geodinamică și mediu, precum și în politicile de integrare în educație a tehnologiei informației și comunicațiilor. Este membru titular al Academiei Oamenilor de Știință din România și membru corespondent al Academiei de Științe Tehnice din România. Cum spune el, a fi martor sau constructor activ al marii împăcări dintre minte și materie este o răspundere și un privilegiu. Este co-fondator al Catedrei UNESCO de Geodinamică din cadrul Academiei Române, Institutul de Geodinamică, și președintele fondator al Centrului pentru Studii Complexe, centru UNESCO.',
		kogaion:
			'De la 2021, Florin Munteanu este mentor la Kogaion Gifted Academy, iar activitatea lui se leagă direct de munca de cercetare. La Kogaion lucrează cu întrebări, cu sisteme și cu ideea că în natură nimic nu funcționează izolat. Pentru copii și părinți, aceasta este o poartă spre gândirea științifică: de la observație la ipoteză, de la ipoteză la verificare. Experiența sa în inginerie, geodinamică și integrarea tehnologiei în educație oferă un limbaj simplu pentru întrebări care, la prima vedere, par imposibile.',
		quote:
			'A fost martor sau constructor activ al marii împăcări dintre minte și materie, al transformării materiale și transfigurării spirituale, și asta a rămas mereu o răspundere și un privilegiu. Am promovat în România paradigma Complexității peste 35 de ani, pentru că întrebările bune merită un spațiu în care să crească.',
		expertise: [
			'Știința Complexității',
			'Sisteme',
			'Geodinamică',
			'Gândire critică',
			'Educație științifică'
		]
	},
	{
		slug: 'florin-stefan',
		role: 'Muzician multi-instrumentist și mentor',
		short:
			'De la blockflöte și bouzouki la clape și pian, cu experiența mai multor țări și a unor festivaluri medievale, Florin Ștefan îi arată copiilor că un instrument se poate descoperi oriunde, pe o stradă dintr-un oraș străin.',
		about:
			'Florin Ștefan a studiat muzica autodidact, începând cu chitară acustică încă din liceu. Ca student la Facultatea de Sociologie a Universității Transilvania din Brașov, a urmat secția de canto a Școlii Populare de Arte și a început să cânte la blockflöte și bouzouki irlandez. A trăit trei ani la Londra, a colaborat cu muzicieni din toate colțurile lumii și a concertat prin vestul Europei. Revenit în țară, a lucrat în turism alături de Asociația Cele Mai Frumoase Sate din România și a organizat excursii pentru copii în Țara Făgărașului. A cântat la festivaluri medievale în reconstituiri istorice, a studiat muzica orientală la oud și sitar, iar în prezent este în formația rock Doar Atât.',
		kogaion:
			'În activitățile muzicale de la Kogaion, unde este mentor din 2021, Florin Ștefan lucrează cu sunetul ca pe un material de lucru. Copiii încep cu ce au la îndemână, apoi descoperă că pot trece de la un instrument la altul și că ritmul poate veni din orice loc: din buză, din jurul lor. Activitățile presupun practică, ascultare și încercare repetată, ca în orice meșteșug. Experiența lui de performer și de organizator de turism îi permite să creeze jocuri muzicale în aer liber, unde copiii învață să colaboreze și să asculte unii alții.',
		quote:
			'Am început cu chitara acustică în liceu și am continuat să învăț de atunci. Am cântat pe stradă în orașe străine și la festivaluri medievale, am încercat instrumente rare, de la oud la sitar. Nu am un tip preferat de muzică; am un tip preferat de sunet.',
		expertise: [
			'Muzică multi-instrument',
			'Chitară',
			'Muzică folk și etnică',
			'Sintezizator',
			'Activități muzicale'
		]
	},
	{
		slug: 'gabriel-esanu',
		role: 'Maestru FIDE și profesor de șah',
		short:
			'Peste două decenii printre cele 64 de pătrate l-au adus pe Gabriel Eșanu la titlul de Maestru FIDE, iar pasiunea pentru șah o transmite acum copiilor. Șahul, spune el, îmbină creativitatea și disciplina în același timp.',
		about:
			'Gabriel Eșanu este absolvent de jurnalism și jurnalist cu peste 13 ani de experiență în presa scrisă, online și la televiziune. De aproape 20 de ani joacă șah, iar cei 20 de ani petrecuți printre cele 64 de tablouri de pe tabla albă și neagră i-au adus categoria de Maestru FIDE. De câțiva ani a ales să împărtășească și copiilor pasiunea lui pentru șah. Consideră că șahul este un sport al minții perfect pentru dezvoltarea armonioasă a copiilor, datorită modului în care îmbină creativitatea și disciplina. Este mentor la Kogaion Gifted Academy din 2017.',
		kogaion:
			'În activitățile de șah de la Kogaion, unde este mentor din 2017, Gabriel Eșanu îi învață pe copii să citească o poziție și să vadă ce mutări se potrivesc. Partidele se desfășoară cu gândire, nu cu presiune, iar greșelile sunt tratate ca ocazii de învățare. Pentru un copil, șahul este un exercițiu de atenție, memorie și calcul, dar și de calm în momentele în care lucrul nu merge cum era planificat. Experiența de Maestru FIDE îi dă materialul cu care poate explica fiecare idee pe înțelesul vârstei.',
		quote:
			'Șahul este un sport al minții, dar nu doar al memoriei: este locul unde creativitatea și disciplina se întâlnesc. Am ales să le spun copiilor asta, fiindcă îmbinarea celor două îi ajută să crească armonios.',
		expertise: ['Șah', 'Maestru FIDE', 'Gândire strategică', 'Jurnalism', 'Concentrare']
	},
	{
		slug: 'george-grama',
		role: 'Arhitect și coordonator de proiect',
		short:
			'Arhitect, autorul propunerii Roman – Un nou început pentru mobilitatea urbană durabilă, George Grama coordonează la Kogaion proiectul de tehnologie primitivă, unde copiii și tinerii construiesc cu mâinile lor.',
		about:
			'George Grama este arhitect și pasionat de natură și bioclimat. Face parte din grupul de inițiativă civică Next Space și a propus orașului Roman un proiect de mobilitate urbană durabilă intitulat Roman – Un nou început. Îi iubește copiii pe care îi învață despre natură și mediu curat, despre ecologie și managementul crizelor, iar această latură a activității sale se vede direct în proiectele pe care le coordonează la Kogaion, unde a construit deja două căsuțe în copac alături de participanți. Este colaborator Kogaion din 2018 și mentor Kogaion Gifted Academy din 2021.',
		kogaion:
			'George Grama lucrează la Kogaion în două planuri. Coordonează proiectul de tehnologie primitivă prin care copiii și adolescentii construiesc cu propriile mâini, iar acolo au apărut deja două căsuțe în copac. Activitatea pune accentul pe ce se poate face cu materiale simple și idei bune, fără utilaje complicate. Aceasta este și o lecție despre mediu: ce se face cu pământ, cu lemn și cu locul în care trăiești are consecințe. Din 2018 este colaborator Kogaion, iar din 2021 mentor Kogaion Gifted Academy.',
		quote:
			'Îi iubesc copiii pe care îi învață despre natură și mediu curat. Nu am nevoie de utilaje complicate ca să construiesc cu ei: am nevoie de idei bune, de lemn, de pământ și de răbdare. Acolo unde punem mâna, înțelegem mai bine ce loc trăim.',
		expertise: [
			'Arhitectură',
			'Bioclimat',
			'Ecologie',
			'Tehnologie primitivă',
			'Mediu și sustenabilitate'
		]
	},
	{
		slug: 'irina-nicolaescu',
		role: 'Psiholog, dezvoltare personală',
		short:
			'Licențiată în psihologie, cu un master în psihoterapie unificatoare și cinci ani de experiență directă cu copiii prin voluntariat la Salvați copiii, Irina Nicolaescu știe ce înseamnă să lucrezi cu cineva care are nevoie de timp.',
		about:
			'Irina Nicolaescu este licențiată în Psihologie la Facultatea din București. A urmat un master în psihoterapie unificatoare și dezvoltare personală, coordonat de doamna Iolanda Mitrofan. Iubește foarte mult natura și copiii, iar cei cinci ani de experiență directă cu copiii, dobândiți prin voluntariat la Salvați copiii, îi-au dat o bază concretă pentru relația de lucru: răbdare, prezență și încredere. Este mentor la Kogaion din 2023, iar aici construiește un spațiu în care copiii și tinerii pot vorbi despre ce îi cântărește, fără să fie nevoie să poarte greutatea singuri.',
		kogaion:
			'În munca sa de la Kogaion, Irina Nicolaescu pornește de la nevoia reală a fiecărui copil, nu de la un program fix. Ascultă, observă și construiește exerciții simple, adaptate vârstei, în care copiii exersează să recunoască emoțiile și să le dea nume. Psihoterapia unificatoare și dezvoltarea personală îi oferă un limbaj potrivit și pentru tineri care trec prin schimbări grele. Cinci ani de lucru voluntar cu copiii îi amintesc zilnic că răbdarea nu e o tehnică, ci o atitudine.',
		quote:
			'Iubesc foarte mult natura și copiii. Am învățat cel mai mult din cei cinci ani de voluntariat la Salvați copiii: un copil are nevoie să fie ascultat înainte de a fi corectat.',
		expertise: [
			'Psihologie',
			'Psihoterapie',
			'Dezvoltare personală',
			'Lucru cu copiii',
			'Comunicare'
		]
	},
	{
		slug: 'iulian-glita',
		role: 'Actor, regizor și scenograf',
		short:
			'Absolvent al Artelor Spectacolului de la Universitatea Babeș-Bolyai, actor la Teatrul în Culise, la Teatrul Godot și la Teatrul de Comedie, Iulian Glita folosește jocul și povestea ca pe cel mai simplu instrument pedagogic.',
		about:
			'Iulian Glita este actor liber profesionist, regizor și scenograf. A absolvit Facultatea de Teatru și Televiziune, specializarea Artele Spectacolului, din cadrul Universității Babeș-Bolyai din Cluj Napoca. Ca actor a jucat în numeroase piese de teatru, între care Human Animals și Obsession la Teatrul în Culise în 2013, Kasa poporului la Teatrul Godot în 2011 și Te vei întoarce în Galapagos la Teatrul de Comedie în 2006. A apărut și în filme, precum Minunata nefericire în 2009 sau Coridorul lui Statxovic în 2008. Este mentor la Kogaion Gifted Academy din 2013, aducând în fața copiilor toată experiența scenă.',
		kogaion:
			'La Kogaion, unde este mentor din 2013, Iulian Glita lucrează cu expresia. Copiii învață să intre într-un personaj, să își schimbe vocea, corpul și ritmul, iar prin joc ajung să vorbească despre lucruri pe care în mod normal nu le-ar spune. Activitățile de teatru le oferă un loc sigur în care pot încerca lucruri noi fără să fie evaluate pentru rezultat. Experiența sa de actor, regizor și scenograf îi permite să construiască exerciții simple, din improvizație și din joc de rol.',
		quote:
			'A jucat în piese la Teatrul în Culise, la Teatrul Godot și la Teatrul de Comedie, iar pe scenă am învățat mai mult decât oriunde. Când lucrez cu copiii, încerc să le spun același lucru: poți fi altcineva timp de o oră și rămâi tu.',
		expertise: ['Teatru', 'Acting', 'Regie', 'Scenografie', 'Joc de rol']
	},
	{
		slug: 'luminita-muresan',
		role: 'Psiholog clinician și psihoterapeut',
		// bio_ro is empty in the database: `about`, `kogaion` and `short` stay empty
		// rather than being padded with invented biography. `quote` too.
		short: '',
		about: '',
		kogaion: '',
		quote: '',
		expertise: ['Psihologie clinică', 'Psichoterapie', 'Mediere Feuerstein']
	},
	{
		slug: 'madalina-gavrilescu',
		role: 'Consultant trainer și motivational coach',
		short:
			'Douăzeci de ani de management de echipă în cercetarea de piață, în Relații Publice la SNSPA și un stagiu ca voluntar la Greenpeace: Mădălina Gavrilescu îi ajută pe copii să aibă încredere să spună ce gândesc.',
		about:
			'Mădălina Gavrilescu este consultant trainer și motivational coach. Este licențiată în Relații Publice și Comunicare la SNSPA și a activat ca voluntar în Greenpeace și Open Doors. Peste 20 de ani de experiență în managementul de echipă, în firme de top din domeniul cercetării de piață, i-au permis o trecere firească spre lucrul cu copii. Este convinsă că trebuie să schimbăm modul în care ne raportăm unii la alții și că bunăstarea fizică, psihică și socială a vieții se măsoară în relații, nu în lucruri. În timpul liber pictează, modelează lutul și pescuiește păstrăvi.',
		kogaion:
			'În activitățile de la Kogaion, Mădălina Gavrilescu folosește coachingul ca pe un exercițiu de încredere. Fiecare copil are nevoie să se simtă în largul lui, să aibă curajul să împărtășească gândurile și problemele, iar soluția se caută împreună, nu i se impune. Atelierele ei pleacă de la întrebări simple, folosesc jocuri și exerciții pe roluri, iar copiii exersează să asculte. Experiența de douăzeci de ani în conducerea echipelor îi dă un material bogat de situații reale pe care le poate transforma în exercițiu.',
		quote:
			'Am credința că trebuie să schimbăm modul în care ne raportăm unii la alții, iar cel mai important argument este acela că bunăstarea fizică, psihică și socială a vieții se măsoară în relații, nu în lucruri.',
		expertise: ['Coaching', 'Relații publice', 'Comunicare', 'Lucru în echipă', 'Încredere în sine']
	},
	{
		slug: 'nicolae-cruceru',
		role: 'Cercetător, geolog și speolog',
		short:
			'Cercetător colaborator la Institutul de Speologie Emil Racoviță al Academiei Române, specializat în procesele periglaciare din Carpați, Nicolae Cruceru aduce la Kogaion geologia, gheața și schimbările climatice văzute de aproape.',
		about:
			'Nicolae Cruceru este cercetător, geolog și speolog, cercetător colaborator al Academiei Române, la Institutul de Speologie Emil Racoviță. De-a lungul carierei a adunat cunoștințe enciclopedice în domenii precum procesele și formele periglaciare din Carpații Românești, permafrostul montan, de la cartare și modelare la analiza factorilor de control, interacțiunile dintre procesele geomorfologice și arbori, în dendrogeomorfologie, și impactul schimbărilor climatice asupra domeniului periglaciar montan. Este o persoană deosebită, cu o cultură și o personalitate remarcabile, și este dornic să împărtășească cunoașterea și pasiunea sa pentru lumea din jur atât adulților, cât mai ales copiilor. Este mentor Kogaion Gifted Academy din 2020.',
		kogaion:
			'La Kogaion, unde este mentor din 2020, Nicolae Cruceru lucrează cu descoperirea. Copiii învață să privească un munte, o piatră sau o formațiune de gheață ca pe niște obiecte care ascund o poveste, și învață să pună întrebări despre ce le au în față. Activitățile de teren transformă geologia într-un lucru practic, în care informația se adună pas cu pas. Experiența sa de cercetător îi permite să explice procese complexe, precum permafrostul sau schimbările climatice, fără să piardă din vedere detaliul care îl face credibil.',
		quote:
			'Sunt dornic să împărtășesc cunoașterea și pasiunea mea pentru lumea din jur, nu doar adulților, ci mai ales copiilor. Când stai lângă un permafrost sau în fața unui munte, înțelegi repede că școala nu se termină înăuntru.',
		expertise: ['Geologie', 'Speologie', 'Periglaciar', 'Schimbări climatice', 'Cercetare']
	},
	{
		slug: 'ovidiu-harbada',
		role: 'Autor și promotor al autovindecării',
		short:
			'Autorul cărților Bucuria Regăsirii de Sine și De vorbă cu Valeriu Popa despre sănătate și viață, Ovidiu Harbădă propune la Kogaion o întrebare simplă: ce se poate schimba în mine, prin cunoaștere și credință?',
		about:
			'Ovidiu Harbădă este autor român și cercetător al fenomenelor spirituale, promotor al sănătății holistice. Este cunoscut pentru munca dedicată promovării metodelor de tratament naturist și a filosofiei de viață a renumitului bioterapeut Valeriu Popa. Scrierile sale se concentrează pe sănătatea holistică, medicina alternativă, autovindecarea, fitoterapia, autocunoașterea și legătura dintre starea spirituală și cea biologică a omului. Susține că omul se poate vindeca prin cunoaștere și credință, considerând că învingătorii sunt cei care reușesc să își schimbe stările biologice negative prin raționamente pozitive și prin regăsirea de sine. Dintre lucrările sale se numără Bucuria Regăsirii de Sine și De vorbă cu Valeriu Popa despre sănătate și viață.',
		kogaion:
			'La Kogaion, Ovidiu Harbădă pornește de la întrebarea care le stă tinerilor la bază: de ce se îmbolnăvesc oamenii și ce se poate face altfel. Experiența lui în sănătate holistică și în promovarea metodelor de tratament naturist îi oferă un vocabular concret, iar lucrarea sa despre legătura dintre starea spirituală și cea biologică arată copiilor și tinerilor că gândirea și corpul nu sunt separate. Nu este o invitație la formule rapide, ci la un mod de a asculta mai atent ce se întâmplă cu propriul corp.',
		quote:
			'Omul se poate vindeca prin cunoaștere și credință. Învingătorii sunt cei care reușesc să își schimbe stările biologice negative prin raționamente pozitive și prin regăsirea de sine. Am dedicat scrierile mele exact acestui drum.',
		expertise: [
			'Sănătate holistică',
			'Autovindecare',
			'Medicină alternativă',
			'Autocunoaștere',
			'Fitoterapie'
		]
	},
	{
		slug: 'petre-butunoi-olteanu',
		role: 'Mentor programare și robotică',
		short:
			'După ani la Microsoft și Huawei, Petre Butunoi-Olteanu îi ajută pe copii și adolescenți să treacă de la utilizatori de tehnologie la constructori de sisteme, cu proiecte în Python, C++, JavaScript și Unity.',
		about:
			'Petre Butunoi-Olteanu este inginer IT, cu o licență în Electronică, Telecomunicații și Tehnologia Informației și un master în Computers and Information Technology la Universitatea Politehnică București. Are un background solid în cloud, infrastructură și securitate, dobândit inclusiv în parcursul său profesional la Microsoft și la Huawei Technologies, în Hangzhou. A decis ulterior să se îndrepte spre zona de mentorat pentru copii și adolescenți, unde lucrează la programare și robotică, dezvoltând gândirea logică prin platforme și proiecte în Python, C++, JavaScript și Unity, cu metodologii adaptate vârstei. Este mentor colaborator Kogaion din 2026.',
		kogaion:
			'În tabăra de tehnologie, Petre Butunoi-Olteanu creează un cadru în care adolescenții trec de la utilizatori de tehnologie la constructori de sisteme. Proiectele au pași clari, iar debuggingul este ghidat, nu lăsat la întâmplere. La final apar standarde de calitate, colaborare în echipă și prezentare în fața celorlalți, adică exact lucrurile pe care le cere orice echipă reală. Experiența sa în cloud și securitate se vede în rigoarea cu care sunt construite proiectele, iar didactica e adaptată la vârsta fiecărui participant.',
		quote:
			'Întâlnesc tineri care folosesc tehnologia fără să o înțeleagă. De aceea vreau să treacă de la utilizatori de tehnologie la constructori de sisteme: proiecte cu pași clari, debugging ghidat și o prezentare finală în fața echipei.',
		expertise: ['Programare', 'Robotică', 'Python', 'Cloud și infrastructură', 'Gândire logică']
	},
	{
		slug: 'roberto-stan',
		role: 'Director de imagine și mentor cinematografie',
		short:
			'Absolvent al UNATC ca director de imagine în 2016, cu proiecte de la clipuri muzicale la reclame, scurtmetraje și lungmetraje, Roberto Stan îi arată tinerilor cum se filmează o scenă, de la lumină la emoție.',
		about:
			'Roberto Stan este absolvent al UNATC, unde a studiat direcția de imagine, în anul 2016, și de atunci se dezvoltă continuu în meserie. A realizat nenumărate proiecte, de la clipuri muzicale la reclame, scurtmetraje și lungmetraje, lucrând pe imaginea care le ține laolaltă. Se consideră o persoană comunicativă și empatică, îi place să creeze și spune că își iubește jobul și tot ce ține de cinematografie. Experiența acumulată îi permite să arăta, pas cu pas, cum se construiește o imagine. Este mentor la Kogaion Gifted Academy din 2023.',
		kogaion:
			'La Kogaion, unde este mentor din 2023, Roberto Stan lucrează cu ochii copiilor și ai tinerilor. Le arată ce se întâmplă când schimbi lumina, când muiești camera sau când lași personajul să tacă o clipă. Activitățile de film pentru copii pun accentul pe poveste și pe curajul de a încerca lucruri noi. Experiența lui de director de imagine îi permite să transforme o tehnică aparent plictisitoare într-un joc, iar faptul că este comunicativ și empatic îi ajută să lucreze bine cu echipe la vârste diferite.',
		quote:
			'Îmi place să creez și mă consider o persoană comunicativă și empatică. Îmi iubesc job-ul și tot ce ține de cinematografie. Am absolvit în 2016 UNATC ca director de imagine și de atunci mă dezvolt continuu.',
		expertise: [
			'Direcție de imagine',
			'Cinematografie',
			'Film pentru copii',
			'Lumină și culoare',
			'Comunicare'
		]
	}
];
