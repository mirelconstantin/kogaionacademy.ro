/**
 * Mentor profile content, batch 3 of 3.
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

export const mentorProfileBatch3: MentorProfileContent[] = [
	{
		slug: 'alexandru-mironov',
		role: 'Scriitor și jurnalist, popularizare științifică',
		short:
			'Ajută tinerii să descopere știința prin povești. Alexandru Mironov a realizat peste 4.000 de emisiuni și aproape 1.000 de articole de popularizare, iar în tinerețe a fost vicecampion național la scrima.',
		about:
			'Alexandru Mironov, supranumit „radio-tele-profesorul”, este scriitor și jurnalist cu o activitate întinsă de-a lungul deceniilor în popularizarea științei și a literaturii science fiction în cadrul Radiodifuziunii Române și a Televiziunii Române. A realizat peste 4.000 de emisiuni și aproximativ 1.000 de articole cu caracter de popularizare a științei, fiind unul dintre inventatorii și promotorii celebrului Almanah Anticipația și ai Colecției de Povestiri Științifico-Fantastice. A practicat scrima, ajungând vicecampion național, iar în anii 1990 a deținut funcția de președinte al Federației de Scrima. Recent, i-a fost acordat titlul de Doctor Honoris Causa al Universității Suceava.',
		kogaion:
			'În Kogaion, Alexandru Mironov lucrează cu tineri pasionați de știință și de poveste. Experiența sa de decenii în popularizarea științei la radio și la televiziune îi permite să transforme informația într-un mod de narare pe care copiii și adolescentii îl pot urmări cu atenție. Îi învață să pună întrebări și să lege între ele fapte din lumea reală și povestiri de anticipație, fără să piardă rigoarea. Este mentor Kogaion Gifted Academy din anul 2015.',
		quote:
			'M-au numit „radio-tele-profesorul”, iar eu îmi asum numele cu drag. Am realizat peste 4.000 de emisiuni și aproape 1.000 de articole, totul pentru ca știința să ajungă la cei care o vor iubi.',
		expertise: ['Popularizare știință', 'Science fiction', 'Jurnalism', 'Scrimă']
	},
	{
		slug: 'alin-mardare',
		role: 'Mentor inginerie civilă și construcții',
		short:
			'Inginer civil de profesie, Alin Mardare aduce în Kogaion perspectiva construcțiilor și o pasiune reală pentru lemn. Iubește drumețile lungi în natură și caută un stil de viață sustenabil, prietenos cu planeta.',
		about:
			'Alin Mardare este licențiat în inginerie civilă, specializarea construcții, meseria care stă la baza oricărei clădiri. Dincolo de cursuri, are o mare pasiune în a lucra lemnul, material pe care îl prelucrează în timpul liber ca pe un mod de a-și exprima creativitatea. Iubește drumețiile în natură și plimbările lungi, iar această legătură cu aerul liber îl face să urmărească un stil de viață sustenabil și prietenos cu planeta. Combinarea studiilor de inginerie cu lucrul efectiv cu lemnul îi oferă o privire practică asupra construcției. Este mentor Kogaion Gifted Academy din anul 2023.',
		kogaion:
			'În Kogaion, Alin Mardare lucrează cu copiii și tinerii curioși de lumea construcțiilor. Formația sa în inginerie civilă îi permite să le arate, în cuvinte simple, cum se gândește o clădire și ce înseamnă să alegi corect un material. Pasiunea lui pentru lemn și pentru un stil de viață sustenabil adaugă o notă practică: copiii învață mai repede când văd, ating și încearcă ei înșiși. Este mentor Kogaion Gifted Academy din anul 2023.',
		quote:
			'Îmi plac drumețiile în natură și plimbările lungi. Aspir la un stil de viață sustenabil și prietenos cu planeta, iar în timpul liber îmi place să îmi folosesc creativitatea în lucrul cu lemnul.',
		expertise: ['Inginerie civilă', 'Construcții', 'Prelucra lemnului', 'Sustenabilitate']
	},
	{
		slug: 'anca-graur',
		role: 'Arhitect și asistent universitar',
		short:
			'Arhitect, doctorand și asistent universitar, Anca Graur predă desenul și softuri de proiectare, de la adulți până la cei mai mici. A câștigat locul 1 la un concurs internațional, după ce a lucrat în Polonia și Olanda.',
		about:
			'Anca Graur a absolvit Facultatea de Arhitectură în 2017, în cadrul Universității de Arhitectură și Urbanism „Ion Mincu”, iar după un an s-a întors în universitate și a început doctoratul, pentru că procesul de învățare nu se oprește niciodată. Doctoratul a adus cu sine activitatea didactică: este asistent universitar la departamentul Bazele proiectării de Arhitectură. Acolo a descoperit că îi place să lucreze cu studenții și să le împărtășească cunoștințele pe înțelesul fiecăruia. Organizează pe cont propriu cursuri de desen și de softuri digitale de proiectare, de la adulți până la cei mai mici, iar în paralel lucrează ca arhitect, cu experiență internațională în Polonia și Olanda, unde a câștigat primul loc într-un concurs internațional de mare anvergură.',
		kogaion:
			'În Kogaion, Anca Graur îndrume micii viitori arhitecți. Ține cursuri de desen și de softuri digitale de proiectare, la niveluri diferite de vârstă, acolo unde gândirea spațială se formează de timpuriu și merge mână în mână cu desenul de mână. Experiența universitară îi arată copiilor ce înseamnă să primești un feed-back sincer și să îl folosești, iar experiența de arhitect le arată pentru ce se desenează. Ce le place cel mai mult, spune chiar ea, este posibilitatea de a descoperi mici arhitecți.',
		quote:
			'Înclinația mea pentru predare nu m-a lăsat să renunț la pasiunea mea, arhitectura. Predarea de arhitectură, sub orice formă, îmbină cele două mari pasiuni ale mele și mă ajută să simt că sunt împlinită. Iar procesul de învățare nu se oprește niciodată.',
		expertise: ['Arhitectură', 'Desen', 'Software de proiectare', 'Pedagogie']
	},
	{
		slug: 'sara-iosub',
		role: 'Arhitectă și asistentă universitară',
		short:
			'Absolventă a Facultății de Arhitectură „Ion Mincu” și asistentă universitară, Sara Iosub își continuă studiile doctorale. La cursul „Cuibar” de desen de arhitectură vede predarea ca pe una dintre cele mai mari împliniri profesionale.',
		about:
			'Sara Iosub a absolvit Facultatea de Arhitectură din cadrul Universității de Arhitectură și Urbanism „Ion Mincu”. Din dorința de a aprofunda domeniul arhitecturii și de a continua procesul de cercetare și învățare, și-a început studiile doctorale, iar în prezent activează ca asistent universitar în cadrul aceleiași facultăți, contribuind la formarea noilor generații de studenți. În paralel cu activitatea academică, Sara este colaboratoare în cadrul cursului „Cuibar” de desen de arhitectură. Experiența acumulată atât în mediul universitar, cât și în cel privat i-a consolidat convingerea că predarea și împărtășirea cunoștințelor reprezintă unele dintre cele mai mari împliniri profesionale și personale. Este mentor colaborator Kogaion Gifted Academy din anul 2026.',
		kogaion:
			'În Kogaion, Sara Iosub lucrează cu copiii și tinerii care descoperă arhitectura prin desen. Activitatea ei universitară, prin care contribuie la formarea noilor generații de studenți, îi oferă un mod de a explica: pornește de la ce înseamnă o clădire și de ce se construiește așa, nu de la formule. Oricât de simplu pare subiectul la început, obiectivul e să înțeleagă ideea din spatele desenului și să încerce singur variante. Ținut laolaltă, desenul de mână și gândirea de arhitect înseamnă să lucrezi cu tot trupul.',
		quote:
			'Experiența acumulată atât în mediul universitar, cât și în cel privat m-a consolidat convingerea că predarea și împărtășirea cunoștințelor reprezintă unele dintre cele mai mari împliniri profesionale și personale. Am vrut să continu să învăț, așa că am pornit spre doctorat.',
		expertise: ['Arhitectură', 'Desen de arhitectură', 'Învățământ universitar', 'Didactică']
	},
	{
		slug: 'smaranda-andronic',
		role: 'Mentor robotică și tehnologie',
		short:
			'Traduce tehnologia în proiecte pe care copiii le duc până la capăt. Smaranda Andronic predă robotică la Universitatea București și îi învață pe cei mici să înțeleagă de ce apare o eroare, nu doar ce se face.',
		about:
			'Smaranda Andronic este inginer cu formare avansată în sisteme embedded și robotică: master în Embedded Systems și licență în Computer Science & IT. Experiența ei practică acoperă atât proiectele hardware-software, cât și predarea. Este asistent universitar la Universitatea București, unde susține laboratoare de Introducere în Robotică și lucrează cu microcontrolere, senzori și sisteme de control aplicate. În proiectele personale a construit soluții precum un Smart Home cu control local și remote, MQTT și aplicație mobil, sau un Arduino line follower cu PID, integrând concepte embedded, rețelistică și elemente de AI și LLM ca suport tehnic. Este mentor colaborator Kogaion din anul 2025.',
		kogaion:
			'În Kogaion, Smaranda Andronic lucrează cu copiii la activitățile de robotică din tabără, unde tehnologia devine un proiect pe care fiecare îl duce până la capăt. Ei învață să conecteze corect componentele, să înțeleagă cauza unei erori, apoi să testeze și să îmbunătățească. Stilul ei este cald, pragmatic și orientat pe autonomie: copilul simte că pot să fac, nu că mi s-a făcut. Laboratoarele ținute la Universitatea București îi oferă rigoarea tehnică, iar experiența în proiecte hardware-software îi permite să aleagă exerciții care chiar se pot construi.',
		quote:
			'Traduc tehnologia în experiențe de proiect accesibile copiilor. Fiecare învață să conecteze corect componentele, să înțeleagă cauza unei erori, să testeze și să îmbunătățească. Stilul meu e cald, pragmatic și orientat pe autonomie: copilul simte că pot să fac.',
		expertise: [
			'Robotică',
			'Sisteme embedded',
			'Microcontrolere',
			'Arduino',
			'Predare universitară'
		]
	},
	{
		slug: 'tiberiu-emil-tioc',
		role: 'Cercetător Delta Dunării',
		short:
			'Douăzeci de ani de cercetare în Delta Dunării și o licență în Biologie la Sibiu. Tiberiu Tioc combină experiența de ghid cu dragul de copii și îi ghidează spre științele naturii interactiv și multidisciplinar.',
		about:
			'Tiberiu Tioc are o vastă experiență în științele naturii, fiind cercetător în Delta Dunării timp de peste 20 de ani. Este licențiat în Biologie la Sibiu, unde este și profesor de biologie, și lector de curs de ghid turistic în Delta Dunării. Și-a făcut din natură și o vocație de teren: este formator în Forest Bathing în Germania, monitor de ski și snowboard și fotograf acreditat. A coordonat numeroase proiecte în Delta Dunării, între care Delta Dunării – peisajul anului și realizarea designului și dotarea Muzeului Deltei, a participat la numeroase târguri internaționale de turism și a fost lector la diverse simpozioane cu teme turistice în țară și străinătate. Este mentor colaborator Kogaion din anul 2024.',
		kogaion:
			'În Kogaion, Tiberiu Tioc îi ghidează pe copii spre cunoașterea științelor naturii într-un mod interactiv și multidisciplinar. Cei peste douăzeci de ani petrecuți în Delta Dunării îi oferă o privire de teren asupra ecosistemelor, iar formarea ca ghid turistic îi arată cum se citește un peisaj. Activitățile urmăresc observarea directă, punerea de întrebări și legarea între biologie, geografie și protejarea mediului. Este mentor colaborator Kogaion din anul 2024.',
		quote:
			'Am un mare drag de copii și îi ghidez spre cunoașterea științelor naturii într-un mod interactiv și multidisciplinar. Am trăit peste douăzeci de ani în Delta Dunării, iar ce am văzut acolo nu se uită niciodată.',
		expertise: [
			'Biologie',
			'Cercetare de teren',
			'Ghid turistic',
			'Forest bathing',
			'Științele naturii'
		]
	},
	{
		slug: 'uca-marinescu',
		role: 'Profesor și explorator',
		short:
			'Prima femeie din lume care a atins toți cei patru poli, explorator și profesor. Uca Marinescu duce în fața tinerilor o experiență de viață obținută în teren, pe schiuri, la polii lumii.',
		about:
			'Uca Marinescu este profesor, explorator și sportiv de performanță, deținătoare a unor recorduri naționale și mondiale. Este prima femeie din lume care a atins toți cei patru poli, geografici și magnetici, și prima româncă ce a ajuns în Antarctica. La 62 de ani deține primul dublu record mondial prin atingerea Polului Nord și a Polului Sud pe schiuri, fiind prima româncă și a treia femeie din lume care reușește acest lucru. A primit Diploma de excelență din partea Comitetului Olimpic Român și a Comitetului Internațional Olimpic și Ordinul Național de Merit în grad de Cavaler de la Președintele României. Este membră a Societății Române de Geografie și a Asociației Americane de Geografie.',
		kogaion:
			'În Kogaion, Uca Marinescu îi ajută pe copii și tineri să înțeleagă ce înseamnă un obiectiv care pare imposibil și ce se întâmplă pe drum spre el. Cum a ajuns la polii lumii, știe cât de mult contează pregătirea, echipul și răbdarea de a reveni după fiecare încercare. Experiența de profesor o pune în contact direct cu cei care încep să își formeze propriile ambiții, iar povestea ei le arată că performanța se construiește ani la rând. Este mentor Kogaion Gifted Academy din anul 2016.',
		quote:
			'Sunt prima femeie din lume care a atins toți cei patru poli, geografici și magnetici. Am ajuns prima româncă în Antarctica, iar primul dublu record mondial prin atingerea Polului Nord și a Polului Sud pe schiuri l-am obținut la 62 de ani.',
		expertise: ['Explorație polară', 'Sport de performanță', 'Geografie', 'Profesor']
	},
	{
		slug: 'vlad-andrei-raducanu',
		role: 'Arhitect, designer algoritmic',
		short:
			'Douăzeci și șapte de ani predând desen de arhitectură, dintre care zece la UNArte, plus un an Erasmus la Dessau, unde s-a inițiat în design algoritmic. Cunoscut ca „Zoster”, Vlad Andrei Răducanu predă la Kogaion din 2026.',
		about:
			'Andrei Răducanu, cunoscut și ca „Zoster”, predă desen de arhitectură în regim privat de 17 ani, în cadrul cursurilor „Cuibar”, și a predat timp de 10 ani la UNArte. A absolvit Universitatea de Arhitectură și Urbanism „Ion Mincu” și un an de Erasmus în Germania, la Dessau Institute of Architecture, unde a fost inițiat în design algoritmic, cunoscut și ca generativ sau computațional, susținând ulterior o serie de workshop-uri pe această temă. Urmează să își dea doctoratul la Universitatea Politehnica București, la departamentul Știința și Ingineria materialelor. În prezent are colaborări în domeniul proiectării, al designului algoritmic și al graficii, în paralel cu pregătirea noilor generații de viitori arhitecți.',
		kogaion:
			'În Kogaion, Vlad Andrei Răducanu lucrează cu copiii și tinerii care vor deveni arhitecți. Predarea desenului de arhitectură, cu care se întâlnește de peste două decenii, îi permite să pornească de la gest și să ajungă, pas cu pas, la o idee de proiect. Designul algoritmic, introdus la Dessau, adaugă o deschidere spre felul în care un calculator poate genera forme, iar experiența de workshop îi arată ce înseamnă să conduci un grup prin explorare. Obiectivul e ca fiecare tânăr să plece de la o foaie goală și să ajungă la ceva care îi aparține.',
		quote:
			'Mă numesc Zoster și predau desen de arhitectură de douăzeci și șapte de ani. La Dessau m-au inițiat în design algoritmic, iar apoi am susținut workshop-uri pe această temă. Îmi place să lucrez cu oameni tineri care încep de la o foaie goală.',
		expertise: ['Arhitectură', 'Desen de arhitectură', 'Design algoritmic', 'Grafică', 'Predare']
	},
	{
		slug: 'adriana-niculina-singeap',
		role: 'Arhitect și certificator case pasive',
		short:
			'Arhitect PHI, membră PHAR și autoarea case pasive pe platforma Institutului. Adriana Sîngeap a condus cu echipa De-a Arhitectura macheta inclusă în Bienala de la Veneția din 2023, iar la Kogaion leagă cursurile de șantiere reale.',
		about:
			'Adriana Niculina Sîngeap este arhitect, absolventă a Universității Tehnice „Gh. Asachi” din Iași, facultatea de arhitectură „G. M. Cantacuzino”. A beneficiat de bursa Erasmus/Socrate din Lisabona în 2005, de școala internațională de vară din Riga în 2004 și de un master la Universitatea din București. După traducerea inițială a cursului de Case Pasive și certificarea ca designer PHI în 2018, a certificat mai multe case pe platforma Institutului. Este membră în PHAR, Asociația Casa Pasivă din România, și conduce un birou de arhitectură din București. Impulsionată de copiii ei, s-a implicat în mai multe proiecte alături de ei, cel mai sonor fiind lucrul în echipa De-a Arhitectura la macheta inclusă în Bienala de la Veneția din 2023.',
		kogaion:
			'În Kogaion, Adriana Sîngeap îmbină cu succes partea teoretică cu cea practică: ține cursuri pentru copii și adulți, dar leagă teoria de proiecte reale, cu șantiere și certificări aferente. Experiența de designer PHI îi permite să arate, în practică, ce înseamnă o casă pasivă și de unde vine economia ei de energie. Lucrul în echipe, observat la De-a Arhitectura și la Bienala de la Veneția, îi arată cât de mult câștigă un copil când vede rezultatul unei idei la scară mare.',
		quote:
			'Am construit case pasive ca profesionist și le-am predat copiilor mei, fiindcă propria lor curiozitate m-a împins spre proiecte la care lucrăm împreună. Îmi place când teoria din curs se vede, peste puțin timp, într-un zid în picioare.',
		expertise: [
			'Arhitectură',
			'Case pasive',
			'Certificare PHI',
			'Construcții sustenabile',
			'Cursuri pentru copii'
		]
	},
	{
		slug: 'dragos-marinescu',
		role: 'Profesor de istorie',
		short:
			'Licențiat în istorie, specializarea Istoria Medievală a României, master în Bizantinologie și doctor în științe istorice. Dragoș Marinescu lucrează de peste 16 ani cu copii de gimnaziu și liceu și organizează activități educaționale în Uniunea Europeană.',
		about:
			'Dragoș Marinescu este licențiat în istorie, cu specializarea Istoria Medievală a României. A absolvit un master în istorie la Universitatea din București, specializarea Bizantinologie, în 1999, și a obținut în 2010 titlul de doctor în științe istorice. Lucrează cu copiii de gimnaziu și de liceu de peste 16 ani, ceea ce îl face unul dintre cei mai apropiați de modul în care ei învață. Și-a completat pregătirea urmând cursuri de gândire critică și de formare psiho-pedagogică. Este organizatorul a numeroase activități legate de educație, cu profesori și copii din țară și din Uniunea Europeană. Este mentor Kogaion Gifted Academy din anul 2016.',
		kogaion:
			'În Kogaion, Dragoș Marinescu îi ajută pe copii și tineri să privească istoria ca pe o poveste care are logică, nu ca pe o listă de date. Cursurile de gândire critică și formarea psiho-pedagogică îi permit să construiască întrebări bune, să susțină o idee și să recunoască când o sursă nu spune ce pare să spună. Experiența de organizator al activităților educaționale din țară și din Uniunea Europeană îi aduce în fața grupului cu instrumente de lucru deja adaptate. Este mentor Kogaion Gifted Academy din anul 2016.',
		quote:
			'Lucrez cu copii de gimnaziu și de liceu de peste 16 ani, iar asta m-a învățat că istoria se învață altfel decât se predă. Am urmat cursuri de gândire critică și de formare psiho-pedagogică tocmai pentru că voiam să știu să pun întrebările care contează.',
		expertise: [
			'Istorie',
			'Istorie medievală',
			'Bizantinologie',
			'Gândire critică',
			'Psichopedagogie'
		]
	},
	{
		slug: 'fabian-andrei-stoica',
		role: 'Mentor programare și robotică',
		short:
			'Inginer electronist licențiat la Politehnica, specializat în procesarea semnalelor și integrare AI. Fabian Stoica a dezvoltat un robot customizat la Robochallenge 2025 și aduce în Kogaion ce îi place: probleme complexe și echipe multidisciplinare.',
		about:
			'Fabian-Andrei Stoica este licențiat al Facultății de Electronică, Telecomunicații și Tehnologia Informației din cadrul Universității Politehnica București. Este trainer de robotică și programare și inginer în electronică aplicată, specializat în procesarea semnalelor și integrarea AI. La Robochallenge 2025 a participat cu un robot customizat, dezvoltat de el. Dincolo de electronică, are experiență aplicată în bio-materiale, hidrogeluri și în mecanica fluidelor ne-newtoniene, la baza printării de țesuturi, o zonă în care ingineria se întâlnește cu biologia. Este mentor colaborator Kogaion din anul 2026.',
		kogaion:
			'În Kogaion, Fabian Stoica lucrează cu tinerii pasionați de tehnică, pe programare, robotică și fizică experimentală. Specializarea în procesarea semnalelor și integrarea AI îi permite să aducă în fața lor probleme reale, cu soluții care trebuie construite și testate pas cu pas. Experiența de la Robochallenge arată că un robot customizat se obține prin iterație, iar ce a învățat lucrând cu materiale și fluide îi oferă răbdarea de a merge acolo unde experimentul devine greu. Este mentor colaborator Kogaion din anul 2026.',
		quote:
			'Îmi place să rezolv probleme complexe, să învăț noi tehnologii și să lucrez în echipe multidisciplinare. Am participat la Robochallenge 2025, unde am dezvoltat un robot customizat. Acolo am învățat că o problemă bună merită oricât timpul necesar.',
		expertise: [
			'Robotică',
			'Programare',
			'Electronică aplicată',
			'Procesarea semnalelor',
			'Fizică experimentală',
			'Integrare AI'
		]
	},
	{
		slug: 'christopher-hermann',
		role: 'Jurist și instructor de autoapărare',
		short:
			'A început cursurile de Hapkido la 6 ani și le predă de peste 10. Jurist cu master în științe penale, Christopher Hermann îi învață pe copii să se apere fără a trece dincolo de limită.',
		about:
			'Christopher Hermann este antreprenor, conducând o firmă de business development pentru companii străine în România și companii românești în străinătate. La bază este jurist, cu master în științe penale și studii în pedagogie, având specializări la Londra, Viena, Berlin, Haga și Varsovia. A început cursurile de autoapărare Hapkido la vârsta de 6 ani, a devenit instructor ulterior și a dezvoltat abilități pedagogice și tehnice în peste 10 ani de predare. În 2016 a fost numit reprezentant oficial al asociației International Hap-Ki-Do Dan-Federation în România. Este convins că practicarea artei martiale încă din copilărie i-a construit un fundament solid, care l-a ajutat de-a lungul vieții în plan social și profesional.',
		kogaion:
			'În Kogaion, Christopher Hermann îi lucrează cu copiii și tinerii care au nevoie să simtă că se pot apăra. Nu învață agresiune, ci un set de valori sănătoase: disciplină, respect, empatie, corectitudine, integritate, plus dezvoltarea personalității, stârnirea ambiției și consolidarea încrederii în sine. Principiul de la care pornește spune tot: nu ataca niciodată, dar nu te lăsa niciodată atacat. Hapkido îi oferă un limbaj al corpului, iar pregătirea juridică și pedagogică îi arată unde se oprește forța și unde începe respectul pentru celălalt.',
		quote:
			'Am început cursurile de Hapkido la 6 ani și le pred de peste 10. Practicarea artei martiale m-a ajutat să-mi construiesc un fundament solid, în special în plan social și profesional. Principiul meu: nu ataca niciodată, dar nu te lăsa niciodată atacat.',
		expertise: ['Autoapărare', 'Hapkido', 'Drept', 'Pedagogie']
	}
];
