/**
 * Mentor data extracted from https://kogaionacademy.ro/mentori/
 * Used by scripts/seed-mentors.ts to populate the DB.
 */
export interface MentorSeed {
	slug: string;
	nameRo: string;
	nameEn: string | null;
	titleRo: string;
	titleEn: string | null;
	bioRo: string;
	bioEn: string | null;
	image: string | null;
	yearJoined: number | null;
	sortOrder: number;
}

export const mentorsSeedData: MentorSeed[] = [
	{
		slug: 'diana-antoci',
		nameRo: 'Diana Antoci',
		nameEn: 'Diana Antoci',
		titleRo:
			'Fondator Kogaion Gifted Academy, Formator în psihopedagogia excelentei fondată de prof. dr. Florian Colceag, Formator Feuerstein',
		titleEn:
			'Founder Kogaion Gifted Academy, Trainer in the psychology of excellence founded by prof. dr. Florian Colceag, Feuerstein Trainer',
		bioRo: `Perfecțiunea și frumusețea naturii, a viului, a Omului, copiii și relațiile pe care le formează cu noua lume, prin respirația primară, prin atingerea mamei, prin cunoașterea universului în care trăim, modul în care se conectează la tot ce este, prin toate trăirile lui și rolul nostru ca părinți în această călătorie a copiilor prin lume, m-au fascinat dintotdeauna.

Sunt mamă a 2 fete, vizionar, autodidact, cu multă pasiune și dăruire pentru ceea ce fac. Provin dintr-o familie cu tradiție de generații în educație și, începând cu anul 2013, am fondat centrul de enrichment Kogaion Gifted Academy împreună cu prof. dr. Florian Colceag, în cadrul căruia am conceput numeroase programe educaționale în premieră pentru educația din România: programul de dezvoltare personală adresat familiei, programul de afterschool cu curriculă integrată, programul intensiv de enrichment de identificare a abilităților copiilor, programul de dezvoltare a inteligențelor multiple prin proiecte transdisciplinare. Sunt licențiată în Economie, Relații Internaționale și am absolvit cursurile Facultății de Psihologie Titu Maiorescu București. Am urmat numeroase cursuri de formare cu prof. dr. Florian Colceag („Curs psihopedagogie: Educația înainte de naștere până la vârsta a IIIa", „Arta de a gândi – rezolvarea crizelor", „Dezvoltarea emisferei cerebrale drepte", „Proiect de țară, proiect de lume", „Schimbarea paradigmei de gândire în educație"), cu prof. dr. Florin Munteanu („Științele complexității"), Wellbeing, Medicină holistică, Alimentație naturală.`,
		bioEn: null,
		image: '/media/uploads/mentori/diana-antoci.webp',
		yearJoined: 2013,
		sortOrder: 1
	},
	{
		slug: 'florian-colceag',
		nameRo: 'Florian Colceag',
		nameEn: 'Florian Colceag',
		titleRo:
			'Fondator Kogaion Gifted Academy, Expert international Gifted Education, promotor gifted education in Romania, doctor in economie, matematician',
		titleEn:
			'Founder Kogaion Gifted Academy, International Gifted Education Expert, promoter of gifted education in Romania, PhD in Economics, mathematician',
		bioRo: `Prof. Dr. Florian Colceag este fondator al Kogaion Gifted Academy si a Institutului de Cercetare si Dezvoltare a Cunoasterii Umane.

Prof. dr. Florian Colceag este expert internațional Gifted Education, specialist în modelare matematică, analist în baza teoriilor complexității, inventator al fractalilor algebrici. Activează ca și consultant în multiple echipe de cercetare din domenii precum biochimie, biofizică, biologie celulară, educație, sociologie, teoria complexității, economie, în cadrul Institutului European de Integrare și a Centrului pentru Studii Complexe. A antrenat lotul olimpic de matematica, fiind detinator al unui record mondial – 84 de medalii obtinute de elevii pe care i-a instruit la olimpiadele internationale de matematica (din care 60 de aur).

Este membru in renumite organizatii internationale, precum World Council for Gifted and Talented Children (WCGTC), European Council for High Ability (ECHA), Pacific Federation of the WCGTC, Clubul de la Roma, Australian Gifted Education (AUSTEGA). A fost desemnat personalitatea europeana a anului 2007.

Este specialist in dezvoltarea de curicule in diferite sisteme de educatie, in modelare economica, sustenabilitate, dezvoltare, globalizare.

Articolele curente pot fi citite pe https://www.hkrdi.org/ro/.`,
		bioEn: null,
		image: '/media/uploads/mentori/florian-colceag.webp',
		yearJoined: 2013,
		sortOrder: 2
	},
	{
		slug: 'florin-munteanu',
		nameRo: 'Florin Munteanu',
		nameEn: 'Florin Munteanu',
		titleRo: 'Explorator, profesor, cercetător, mentor pentru copii și părinți',
		titleEn: 'Explorer, professor, researcher, mentor for children and parents',
		bioRo: `Florin Munteanu ne va conduce sa pasim într-o nouă lume. Profesorul Munteanu și-a dedicat peste 35 de ani din viață promovării în România a paradigmei Complexității. „A fi martor sau constructor activ al marii „împăcări dintre minte şi materie, al transformării materiale şi transfigurării spirituale este o răspundere şi un privilegiu." spune dumnealui. Este Doctor în Ştiinţe, specializat în aplicaţii ale Știinţei Complexității în inginerie, econofizică, geodinamică şi mediu, precum şi în politici de integrare în educaţie a tehnologiei informaţiei şi comunicaţiilor, membru titular al Academiei Oamenilor de Ştiinţă din România, membru corespondent al Academiei de Ştiinţe Tehnice din România, co-fondator al Catedrei UNESCO de Geodinamică din cadrul Academiei Române, Institutul de Geodinamică și Preşedinte fondator al Centrul pentru Studii Complexe – centru UNESCO. Mai multe despre proiectele și omul Florin Munteanu puteți citi aici: https://www.florinmunteanu.ro/

Este mentor Kogaion Gifted Academy din anul 2021.`,
		bioEn: null,
		image: '/media/uploads/mentori/florin-munteanu.webp',
		yearJoined: 2021,
		sortOrder: 3
	},
	{
		slug: 'alina-monica-antoci',
		nameRo: 'Alina Monica Antoci',
		nameEn: 'Alina Monica Antoci',
		titleRo: 'Mentor Comunicare Strategică & Leadership',
		titleEn: 'Strategic Communication & Leadership Mentor',
		bioRo: `Alina este expert specialist la Departamentul de Comerț, Competitivitate și Afaceri in cadrul Grupului Băncii Mondiale unde activeaza din anul 2004 având o experiență extinsă în politici publice, comerț internațional, analiză strategică și leadership institutional, care sprijină țările în îmbunătățirea competitivității lor comerciale și a mediului de afaceri.

Este licențiată în Matematică și Tehnologia Informației, cu specializare în Cercetare Operațională și Statistică, obținută în România. Și-a aprofundat formarea academică la Universitatea Harvard, unde a urmat un program executiv în Politică și Administrare Fiscală Internațională la Facultatea de Drept și a obținut un master în Administrație Publică, Comerț Internațional și Finanțe la John F. Kennedy School of Government.

De-a lungul carierei, Alina a completat pregătirea tehnică cu numeroase programe de specializare în Comunicare Strategică, Leadership și managementul schimbării, concentrându-se pe comunicarea clară a deciziilor complexe, influență strategică și leadership în organizații internaționale.

Din 2025, este mentor colaborator Kogaion, unde susține dezvoltarea liderilor și profesioniștilor prin mentorat aplicat în comunicare strategică, gândire critică și leadership autentic.`,
		bioEn: null,
		image: '/media/uploads/mentori/alina-monica-antoci.webp',
		yearJoined: 2025,
		sortOrder: 4
	},
	{
		slug: 'doru-tatar',
		nameRo: 'Doru Tatar',
		nameEn: 'Doru Tatar',
		titleRo: 'Inventator român',
		titleEn: 'Romanian inventor',
		bioRo: `Doru Tătar este un renumit inginer constructor și inventator roman, cunoscut pentru contribuțiile sale majore în domeniul siderurgiei și metalurgiei. Deține peste 15 brevete de invenții atât în România, cât şi în Statele Unite ale Americii, Germania, Japonia, Mexic şi Belgia, obținând numeroase premii și distincții la târgurile internaționale de inventică. Inovațiile sale au fost implementate cu success în mari unități industriale dar și în uzine metalurgice importante din Europa și America. Este implicat activ în comunitatea inginerilor și este primul președinte al Asociației Creatorilor în Tehnică, militând de-a lungul timpului pentru protejarea drepturilor inventatorilor și optimizarea legislației în domeniu.`,
		bioEn: null,
		image: '/media/uploads/mentori/doru-tatar.webp',
		yearJoined: null,
		sortOrder: 5
	},
	{
		slug: 'andra-nineta-nenciu',
		nameRo: 'Andra Nineta Nenciu',
		nameEn: 'Andra Nineta Nenciu',
		titleRo: 'Artist plastic, fotograf, designer de interior',
		titleEn: 'Visual artist, photographer, interior designer',
		bioRo: `Andra este absolventa a Universitatii Nationale de Arte Bucuresti, Master Sectia grafica, cu o experienta de peste 10 ani in pictura, concept graphic design, specialist tehnica prelucrarii imaginii cu Adobe Photoshop, design ambiental, pictura pe pereti, textile si piele, lemn, sticla, gravura, precum si in tehnici de reprezentare plastica: bazele compozitiei si analiza limbajului vizual. Este fondatorul si coordonatorul conceptului Pictam Vise. A participat la numeroase expozitii in tara si strainatate, intre care mentionam: Expozitia de grup si expozitie personala de gravura la "Casa de cultura Friedrich Schiller", Bucuresti, Muzeul judetean de Arta Prahova, "Ion Ionescu Quintus", Ploiesti, Expozitie de grup la Muzeul de Istorie Bucuresti, Premiul "Suvenir de Bucuresti", Premiul I la concursul organizat de Patriarhia Romana "Icoana din sufletul copilului". Este membra a Galeriei DanaartGallery, Fundatia Ileana Mustatza. Are o experienta de lunga durata cu copiii. Nineta este mentor permanent Kogaion Gifted Academy incepand cu anul 2013.`,
		bioEn: null,
		image: '/media/uploads/mentori/andra-nineta-nenciu.webp',
		yearJoined: 2013,
		sortOrder: 6
	},
	{
		slug: 'iulian-glita',
		nameRo: 'Iulian Glita',
		nameEn: 'Iulian Glita',
		titleRo: 'Actor liber profesionist, regizor, scenograf',
		titleEn: 'Freelance actor, director, set designer',
		bioRo: `Iulian a absolvit Facultatea de Teatru si Televiziune, specializarea Artele Spectacolului din cadrul Universitatii Babes-Bolyai din Cluj Napoca. Ca actor a jucat in numeroase piese de teatru: "Human animals", "Obsession" la Teatrul in Culise (2013), "Kasa poporului" la Teatrul Godot (2011), "Te vei intoarce in Galapagos" la Teatrul de Comedie (2006) si in filme ca: "Minunata nefericire" (2009), "Coridorul lui Statxovic" (2008). Iulian este mentor Kogaion Gifted Academy din anul 2013.`,
		bioEn: null,
		image: '/media/uploads/mentori/iulian-glita.webp',
		yearJoined: 2013,
		sortOrder: 7
	},
	{
		slug: 'andrei-stan',
		nameRo: 'Andrei Stan',
		nameEn: 'Andrei Stan',
		titleRo: 'Regizor de film, fotograf, pasionat de arta colajului',
		titleEn: 'Film director, photographer, collage art enthusiast',
		bioRo: `Andrei Stan este artist multidisciplinar și creativity coach, originar din București. A început ca fotograf, dar și-a continuat călătoria artistică prin dans, actorie, regie de teatru și film, mai apoi continuând cu arta vizuală, muzică și poezie. A urmat cursurile SNSPA și de regie la Met Film School din Londra unde si-a confirmat pasiunea pentru film si arta. A lucrat cu artisti cunoscuti din industria muzicii (Serban Cazan, Alina Eremia, Alexandra Stan) si a realizat documentarul „The pursuit of dreams" unde a colaborat cu speakeri internationali renumiti: Gregg Braden, Joe Dispenza, Bruce Lipton.

Andrei este inițiatorul proiectului internațional Dreaming în Collages, o platforma care promovează artiști de colaje din întreaga lume, este membru co-fondator al comunității Bucharest Collage Collective, membru al comunității artistice Safiticuminti și inițiatorul Collage Festival, primul eveniment local dedicat artei colajului. De ceva timp și-a format și propriul său proiect muzical solo.
Ca și creativity coach, Andrei sustine programe de dezvoltare creativa pentru copii și adulți din 2014. Lucrările lui Andrei Stan pot fi găsite pe site-ul www.andreistan.com sau pe instagram @filters.of.perception. Este mentor Kogaion Gifted Academy din anul 2017.`,
		bioEn: null,
		image: '/media/uploads/mentori/andrei-stan.webp',
		yearJoined: 2017,
		sortOrder: 8
	},
	{
		slug: 'andreea-draghici',
		nameRo: 'Andreea Drăghici',
		nameEn: 'Andreea Drăghici',
		titleRo: 'Biolog, cercetator',
		titleEn: 'Biologist, researcher',
		bioRo: `Andreea este licențiată în biologie (inclusiv modulul de Psihopedagogie). A absolvit masterul în Biochimie și Biologie Moleculară și alte formări adiacente, dar cel mai important – are un mare drag de copii!

Lucrează în cercetare și dar are și activitate în teren, împletește partea teoretică și practică într-un mod armonios și simplu. Are experiență în diferite programe pentru copii (conferințe, cursuri și scoli de vară), fiind colaborator la Muzeul National G. Antipa. Este pasionată de științele naturii și caută cu orice prilej să transmită această pasiune și copiilor.

Este mentor Kogaion Gifted Academy din anul 2019.`,
		bioEn: null,
		image: '/media/uploads/mentori/andreea-draghici.webp',
		yearJoined: 2019,
		sortOrder: 9
	},
	{
		slug: 'madalina-gavrilescu',
		nameRo: 'Mădălina Gavrilescu',
		nameEn: 'Mădălina Gavrilescu',
		titleRo: 'Consultant trainer, Motivational Coach',
		titleEn: 'Consultant trainer, Motivational Coach',
		bioRo: `Mădălina este licențiată în Relații Publice și Comunicare la SNSPA și a activat ca voluntar Greenpeace și Open Doors.

"Am credința că trebuie să schimbăm modul în care ne raportăm unii la alții, iar cel mai important argument este acela că bunăstarea fizică, psihică și socială a vieții se măsoară în relații, nu în lucruri.

Abilitățile de organizare și coaching acumulate în cei peste 20 ani de experiență de management al echipei în firme de top din domeniul cercetării de piață mi-au permis o trecere destul ușoară și firească spre lucrul cu copii, ghidându-i să se simtă în largul lor, să aibă încredere să-și împărtășească gândurile și problemele, să găsim împreună soluții."

În timpul liber îi place să picteze, să modeleze lutul și să pescuiască păstrăvi cu musca artificială în râurile repezi din munți.`,
		bioEn: null,
		image: '/media/uploads/mentori/madalina-gavrilescu.webp',
		yearJoined: null,
		sortOrder: 10
	},
	{
		slug: 'eliza-galan',
		nameRo: 'Eliza Galan',
		nameEn: 'Eliza Galan',
		titleRo: 'Trainer Mindfulness, profesor, poliglot',
		titleEn: 'Mindfulness Trainer, teacher, polyglot',
		bioRo: `Eliza a absolvit Facultatea de Litere, Secția Franceză-Engleză a Universității A.I. Cuza Iași și ulterior a aprofundat literatura francofonă, fiind 9 ani profesoară de limbi străine la gimnaziu. Este pasionată de cunoaștere și comunicare. Vorbește fluent 6 limbi străine: engleză, franceză, italiana, spanolă, portugheză și greacă. De la cunoașterea exterioară a trecut la cunoașterea interioară. „Prin observarea respirației și a senzațiilor am ajuns să mă cunosc mai bine și lucrul ăsta îmi îmbunătățește și comunicarea la exterior. Am atenție mai mare la ceilalți, înțelegere în spatele aparențelor, cunoaștere mai bună de sine, nivel de empatie crescut." În continuarea călătoriei, Eliza a absolvit International Buddhist Studies College din Bangkok.`,
		bioEn: null,
		image: '/media/uploads/mentori/eliza-galan.webp',
		yearJoined: null,
		sortOrder: 11
	},
	{
		slug: 'alvina-turcoman',
		nameRo: 'Alvina Turcoman',
		nameEn: 'Alvina Turcoman',
		titleRo: 'Arhitect',
		titleEn: 'Architect',
		bioRo: `Alvina este absolventă a Universității de Arhitectură și Urbanism "Ion Mincu" iar, ca arhitect și-a propus să includă latura psihologică, umană, în proiectele ei. Încă din perioada facultății a arătat interes înspre a crea spații care să exploateze zona senzorială, plecând de la premisa că spațiile construite influențează modul în care oamenii gândesc, simt și interacționează cu mediul înconjurător, având ca teză de cercetare influența arhitecturii asupra dezvoltării cognitive a copiilor.

Alvina consideră ca viitorul societății este reprezentat de copii iar aceștia au nevoie de toată atenția adulților pentru a se dezvolta corect și armonios, atât fizic, cât și emoțional. De aceea, de-a lungul timpului, s-a implicat în numeroase proiecte cu și despre copii, cel mai reprezentativ fiind ONG-ul " Salvați Copiii", în cadrul căruia a activat ca voluntar si a interacționat prin intermediul proiectelor cu o multitudine de copii, punând astfel bazele înțelegerii psihologiei acestora.`,
		bioEn: null,
		image: '/media/uploads/mentori/alvina-turcoman.webp',
		yearJoined: null,
		sortOrder: 12
	},
	{
		slug: 'irina-nicolaescu',
		nameRo: 'Irina Nicolaescu',
		nameEn: 'Irina Nicolaescu',
		titleRo: 'Psiholog',
		titleEn: 'Psychologist',
		bioRo: `Irina este licențiată în Psihologie, la Facultatea din București. A urmat masterul de psihoterapie unificatoare și dezvoltare personală coordonat de dna Iolanda Mitrofan. Irina iubește foarte mult natura și copiii. Are 5 ani de experiență directă cu copiii prin voluntariat la Salvați copiii. Irina este mentor Kogaion din anul 2023.`,
		bioEn: null,
		image: '/media/uploads/mentori/irina-nicolaescu.webp',
		yearJoined: 2023,
		sortOrder: 13
	},
	{
		slug: 'alin-mardare',
		nameRo: 'Alin Mardare',
		nameEn: 'Alin Mardare',
		titleRo: 'Inginer constructor',
		titleEn: 'Civil engineer',
		bioRo: `Alin este licențiat în inginerie civilă, construcții și are o mare pasiune în a lucra lemnul. „Imi plac drumețiile în natură și plimbările lungi. Aspir la un stil de viață sustenabil și prietenos cu planeta iar în timpul liber îmi place să îmi folosesc creativitatea în lucrul cu lemnul". Este mentor Kogaion Gifted Academy din anul 2023.`,
		bioEn: null,
		image: '/media/uploads/mentori/alin-mardare.webp',
		yearJoined: 2023,
		sortOrder: 14
	},
	{
		slug: 'anca-graur',
		nameRo: 'Anca Graur',
		nameEn: 'Anca Graur',
		titleRo: 'Arhitect, doctorand în arhitectură, asistent universitar',
		titleEn: 'Architect, PhD candidate in architecture, university assistant',
		bioRo: `Anca a absolvit Facultatea de Arhitectură în anul 2017 (în cadrul Universității de Arhitectură și Urbanism „Ion Mincu"), iar după un an a revenit în universitate începând doctoratul, pentru că, după părerea ei, "procesul de învățare nu se oprește niciodată". Începutul doctoratului a dat startul și activității ei didactice, devenind asistent universitar în cadrul Facultății de Arhitectură, la departamentul „Bazele proiectării de Arhitectură". Așa a descoperit că îi place foarte să interacționez cu studenții, să îi ajute și să împărtășească cunoștințele ei pe înțelesul fiecăruia. A început să organizeze pe cont propriu cursuri de desen și de softuri digitale de proiectare, extinzând și intervalul de vârstă al cursanților, de la adulți până la cei mai mici.

„Înclinația mea pentru predare nu m-a lăsat, însă, să renunț la pasiunea mea, arhitectura. În paralel cu această activitate didactică, sunt arhitect. Am experiență internațională în acest domeniu, lucrând în Polonia și Olanda, în cea din urmă chiar câștigând locul 1 în cadrul unui concurs internațional de mare anvergură. Așadar, predarea de arhitectură, sub orice formă, îmbină cele două mari pasiuni ale mele și mă ajută să mă simt împlinită și să fac cu mare plăcere și dedicare cursurile Kogaion, unde pot să îndrum și să descopăr micii viitori arhitecți." Anca este mentor permanent Kogaion din anul 2017.`,
		bioEn: null,
		image: '/media/uploads/mentori/anca-graur.webp',
		yearJoined: 2017,
		sortOrder: 15
	},
	{
		slug: 'ovidiu-harbada',
		nameRo: 'Ovidiu Harbădă',
		nameEn: 'Ovidiu Harbădă',
		titleRo: 'Autor român, promotor al autovindecării prin cunoaștere și credință',
		titleEn: 'Romanian author, promoter of self-healing through knowledge and faith',
		bioRo: `Ovidiu Harbădă este un autor român, cercetător al fenomenelor spirituale și promotor al sănătății holistice, cunoscut în special pentru munca sa dedicată promovării metodelor de tratament naturist și a filosofiei de viață a renumitul bioterapeut Valeriu Popa. Scrierile sale se concentrează pe sănătatea holistică, medicină alternativă, autovindecare, fitoterapie, autocunoaștere și legătura dintre starea spirituală și cea biologică a omului. Ovidiu Harbădă susține că omul se poate vindeca prin cunoaștere și credință, considerând că „învingătorii" sunt cei care reușesc să își schimbe stările biologice negative prin raționamente pozitive și regăsirea de sine. Printre lucrările sale menționăm: „Bucuria Regăsirii de Sine", „De vorbă cu Valeriu Popa despre sănătate și viață", „Omenirea din nou în prag", „Miracolul din fiecare".`,
		bioEn: null,
		image: '/media/uploads/mentori/ovidiu-harbada.webp',
		yearJoined: null,
		sortOrder: 16
	},
	{
		slug: 'tiberiu-emil-tioc',
		nameRo: 'Tiberiu Emil Tioc',
		nameEn: 'Tiberiu Emil Tioc',
		titleRo: 'Biolog, Cercetător, Formator ghid turistic și forest bath, Profesor',
		titleEn: 'Biologist, Researcher, Tourist guide and forest bath Trainer, Professor',
		bioRo: `Tiberiu este un om cu o vastă experiență în științele naturii, fiind cercetător în Delta Dunării peste 20 de ani. Este licențiat în Biologie la Sibiu, Lector de curs de ghid turistic în Delta Dunării, Formator în Forest Bathing în Germania și profesor de biologie în Sibiu, monitor de ski și snowboard, fotograf acreditat. A coordonat numeroase proiecte în Delta Dunării („Delta Dunării – peisajul anului", realizarea designului și dotarea Muzeului Deltei, a participat la numeroase târguri internaționale de turism, a fost lector la diverse simpozioane cu teme turistice în țară și străinătate. Tiberiu are un mare drag de copii, pe care îi ghidează spre cunoașterea științelor naturii într-un mod interactiv și multidisciplinar.

Este mentor colaborator Kogaion din anul 2024.`,
		bioEn: null,
		image: '/media/uploads/mentori/tiberiu-emil-tioc.webp',
		yearJoined: 2024,
		sortOrder: 17
	},
	{
		slug: 'gabriel-esanu',
		nameRo: 'Gabriel Eșanu',
		nameEn: 'Gabriel Eșanu',
		titleRo: 'Profesor de sah, Maestru FIDE, Jurnalist',
		titleEn: 'Chess teacher, FIDE Master, Journalist',
		bioRo: `Gabriel este absolvent de jurnalism, cu experienta de peste 13 ani in presa scrisa, online si TV si de 20 de ani petrecuti printre cele 64 de campuri impartite in alb si negru, care i-au adus si categoria de Maestru FIDE. De cativa ani a ales sa impartaseasca si copiilor pasiunea lui pentru sah, considerand ca sahul este un "sport al mintii" perfect pentru dezvoltarea armonioasa a copiilor, datorita modului în care imbina creativitatea si disciplina.

Este mentor Kogaion Gifted Academy din anul 2017.`,
		bioEn: null,
		image: '/media/uploads/mentori/gabriel-esanu.webp',
		yearJoined: 2017,
		sortOrder: 18
	},
	{
		slug: 'flavian-glont',
		nameRo: 'Flavian Glonț',
		nameEn: 'Flavian Glonț',
		titleRo: 'Profesionist in rezolvarea rapida a cubului Rubik',
		titleEn: 'Professional speedcuber',
		bioRo: `Flavian este student, profesionist in rezolvarea rapida a cubului Rubik. A absolvit Colegiul National „Dinicu Golescu" cu specializarea matematica-informatica intensiv, iar acum este student la Politehnica – Facultatea de Antreprenoriat, Ingineria si Managementul Afacerilor.

Flavian a devenit cunoscut in 2015, dupa ce a castigat show-ul Romanii au Talent, fiind membru al echipei SPEEDCUBING si in 2016 cand a participat la Britain's Got Talent. Cifrele de raiting l-au clasat pe primul loc in topul celor mai cunoscuti speedcube-ri ai Planetei. Dorinta lui Flavian este de a impartasi si celorlalti copii acest sport al mintii ce dezvolta capacitatile matematice, viziunea in spatiu, memoria si dexteritatea. Motto-ul lui este „Imposibilul este Posibil", Flavian fiind multimplu campion national la acest sport al mintii.

Flavian este mentor Kogaion Gifted Academy din anul 2016.`,
		bioEn: null,
		image: '/media/uploads/mentori/flavian-glont.webp',
		yearJoined: 2016,
		sortOrder: 19
	},
	{
		slug: 'dumitru-badila',
		nameRo: 'Dumitru Bădilă',
		nameEn: 'Dumitru Bădilă',
		titleRo: 'Medic, inginer, cercetător energii neconvenționale, inventator, antreprenor',
		titleEn: 'Doctor, engineer, unconventional energy researcher, inventor, entrepreneur',
		bioRo: `Dumitru este absolvent de medicină militară, medic medicină de familie, medic de urgență și termografie medicală. Este cercetător, având multiple lucrări științifice publicate și prezentate la Congrese și Simpozioane. Ca inventator, deține mai multe invenții brevetate în România și o invenție brevetată internațional, între care menționăm Biofotonul – aparat de terapie cu lumina polarizată RO120569 și Tunul Sonic antigrindină, brevet European EP3484273, ambele aflate în producție. Este Director de cercetare în cadrul ultimului proiect, finanțat din fonduri europene.

Este mentor Kogaion Gifted Academy din anul 2015.`,
		bioEn: null,
		image: '/media/uploads/mentori/dumitru-badila.webp',
		yearJoined: 2015,
		sortOrder: 20
	},
	{
		slug: 'andreea-faur',
		nameRo: 'Andreea Faur',
		nameEn: 'Andreea Faur',
		titleRo: 'Doctor în sociologie, psiholog, educator-învățător, asistent social',
		titleEn: 'Doctor in sociology, psychologist, educator-teacher, social worker',
		bioRo: `Andreea este absolventă a Liceului Pedagogic, specializarea educator-învățător și cu definitivat în invățământul preșcolar, este licențiată în asistență socială și psihologie, doctor în sociologie, formator pe programe cognitiv-comportamentale, de grup și individuale. Andreea a acumulat o vastă experiență în psihodramă și medierea relației dintre adulți și copiii cu delincvență juuvenilă. În prezent este consilier de probațiune, formator în lucrul cu persoanele cu adicții și expert internațional în cadrul de comunități terapeutice pentru persoanele cu adicții, copii și adulți. Este psiholog în cadrul programelor Kogaion cu copii. Andreea crede în schimbare și în potențialul uriaș pe care fiecare copil îl are, iar adultul trebuie să învețe să scoată la lumină copilul frumos din interiorul lui. Motto-ul Andreei: ,,Ceea ce dă sens vieții este să pui în inimă în fiecare zi un răsărit de soare"! Este mentor Kogaion Gifted Academy din anul 2018.`,
		bioEn: null,
		image: '/media/uploads/mentori/andreea-faur.webp',
		yearJoined: 2018,
		sortOrder: 21
	},
	{
		slug: 'george-grama',
		nameRo: 'George Grama',
		nameEn: 'George Grama',
		titleRo: 'Arhitect, pasionat de natura, bioclimat',
		titleEn: 'Architect, nature enthusiast, bioclimatic',
		bioRo: `George face parte grupul de inițiativă civică Next Space, propunand orasului Roman un proiect de mobilitate urbana durabila intitulat "Roman – Un nou inceput" (proiectul poate fi consultat aici). Iubeste copiii pe care ii invata despre natura si mediu curat, despre ecologie si managementul crizelor.

George este colaborator Kogaion din anul 2018, fiind coordonator al proiectului de tehnologie primitiva cu adolescentii, cu care a construit deja 2 „casute in copac".

George este mentor Kogaion Gifted Academy din anul 2021.`,
		bioEn: null,
		image: '/media/uploads/mentori/george-grama.webp',
		yearJoined: 2021,
		sortOrder: 22
	},
	{
		slug: 'cristina-isabela-beteringhe',
		nameRo: 'Cristina Isabela Beteringhe',
		nameEn: 'Cristina Isabela Beteringhe',
		titleRo: 'Violonistă, profesoară de vioară și pian',
		titleEn: 'Violinist, violin and piano teacher',
		bioRo: `"Cânt la vioară de la vârsta de 6 ani. De atunci, am studiat muzica clasică în România până când, la 23 de ani, dornică de noi orizonturi, de noi perspective, am decis să mă mut în Olanda, pentru a-mi continua studiile.
Acolo, pentru o perioadă de 5 ani, am fost violonistă în cadrul Orchestra Filharmonie Noord, Groningen, Opera Spanga, Friesland, am înregistrat 4 albume de studio și am susținut proiecte speciale în colaborare cu alți artiști. Pe lângă ansambluri de factură clasică, am colaborat și cu trupe de jazz, de pop-rock experimental, compozitori de muzică modernă, făcând parte din proiecte de muzică pentru film și teatru: trupa de teatru "Different Trains", Groningen, compozitia coloanei sonore pentru filmul The Kid – Charlie Chaplin.
În prezent, pentru că iubesc să cânt și vreau să îmi asum rolul de singer-songwriter, lucrez la primul meu EP.
Am venit înapoi acasă cu dorința de a împărtăși din lucrurile frumoase pe care le-am învățat.
Influența artei, în special a muzicii, cunoașterea limbajului muzical, exersarea creativității (individual și împreună), toate acestea contribuie enorm la dezvoltarea noastră, în toate aspectele ei, la încrederea cu care ne asumăm provocari și bucuria pe care o simțim când ne conectăm cu ceilalți."

Este mentor Kogaion Gifted Academy din anul 2021.`,
		bioEn: null,
		image: '/media/uploads/mentori/cristina-isabela-beteringhe.webp',
		yearJoined: 2021,
		sortOrder: 23
	},
	{
		slug: 'florin-stefan',
		nameRo: 'Florin Ștefan',
		nameEn: 'Florin Ștefan',
		titleRo: 'Muzician multi-instrumentist',
		titleEn: 'Multi-instrumentalist musician',
		bioRo: `Florin a studiat muzica în mod autodidact, începând cu chitara acustică încă din liceu. Ca student la Facultatea de Sociologie a Universității Transilvania din Brașov, a urmat secția de canto a Școlii Populare de Arte și a început să cânte la blockflöte şi bouzouki irlandez. La Londra a locuit timp de 3 ani, unde s-a implicat în diferite proiecte și colaborări cu muzicieni din toate colțurile lumii. Atunci a luat contactul cu mai multe stiluri muzicale și background-uri multiculturale. Tot atunci a început să cânte la clape, orgă – sintetizator și să experimenteze cu diverse efecte de sunet pentru chitară electrică. A călătorit prin vestul Europei (Anglia, Franța, Olanda, Irlanda, Spania și Portugalia), unde a concertat în diferite orașe și a cântat pe stradă. În Dublin a experimentat muzica irlandeză prin intermediul unor fluiere, Irish Whistles. A petrecut o vreme în Lisabona, unde a luat contactul cu muzica portugheză și a achiziționat un model rar de mandolină-liră. A traversat Spania și Franța, cântând dintr-un oraș în altul, iar când a revenit la Londra, și-a strâns toate instrumentele muzicale și le-a trimis în România.
Revenit în țară, a început să lucreze în turism alături de Asociația Cele Mai Frumoase Sate din România. Astfel, a realizat un labirint în lan de porumb în satul Drăguș din jud. Brașov, a organizat excursii pentru copii în Ţara Făgăraşului, a documentat primul ghid turistic al satelor din țara noastră, a tradus în engleză 3 ghiduri cu trasee de motocicletă și a făcut parte din delegațiile române care au participat la Conferințele EDEN, organizate la Comisia Europeană de la Bruxelles. După activitatea în turism, s-a mutat la București, iar pianul nu a fost o noutate, fiind deja familiarizat cu claviaturile. Mai târziu, a început desfășurarea unor activități de reconstituire istorică în cadrul multor festivaluri medievale din țară și străinătate (Bulgaria, Serbia și Danemarca) alături de asociația de re-enactment Compania Dragonului din Cluj Napoca. Cu această ocazie, s-a implicat în proiectul United Colors of Heraldry. A început să studieze muzica orientală prin intermediul unor instrumente exotice: lăută (oud turcesc), sitar și tanpura indiană. Totodată, nu a neglijat muzica electronică, continuând să lucreze cu diverse instrumente cu clape. În prezent, activează în formația rock Doar Atât și este mentor Kogaion Gifted Academy din anul 2021.`,
		bioEn: null,
		image: '/media/uploads/mentori/florin-stefan.webp',
		yearJoined: 2021,
		sortOrder: 24
	},
	{
		slug: 'nicolae-cruceru',
		nameRo: 'Nicolae Cruceru',
		nameEn: 'Nicolae Cruceru',
		titleRo: 'Cercetator, geolog, speolog, tata si om cu pasiuni',
		titleEn: 'Researcher, geologist, speleologist, father and man with passions',
		bioRo: `Nicolae Cruceru este cercetător colaborator al Academiei Române – Institutul de Speologie "Emil Racoviță". Pe lângă cunoștințele enciclopedice din domeniile în care activează ca cercetător (procese şi forme periglaciare în Carpații Românești; permafrostul montan: cartare, modelare si analiza factorilor de control; interacțiuni procese geomorfologice – arbori (dendrogeomorfologie); impactul schimbărilor climatice asupra domeniului periglaciar montan, etc.), dl Cruceru este o persoană deosebită, cu o cultură și o personalitate remarcabile.

Este dornic să împărtășească cunoașterea și pasiunea sa pentru lumea din jur atât adulților cât mai ales – copiilor!

Este mentor Kogaion Gifted Academy din anul 2020.`,
		bioEn: null,
		image: '/media/uploads/mentori/nicolae-cruceru.webp',
		yearJoined: 2020,
		sortOrder: 25
	},
	{
		slug: 'dragos-marinescu',
		nameRo: 'Dragoș Marinescu',
		nameEn: 'Dragoș Marinescu',
		titleRo: 'Doctor in stiinte istorice, profesor de istorie, formare psiho-pedagogica',
		titleEn: 'Doctor in historical sciences, history teacher, psycho-pedagogical training',
		bioRo: `Dragos este licentiat in istorie, specializarea Istoria Medievala a Romaniei. A absolvit un Master in istorie la Universitatea Bucuresti, Specializarea Bizantinologie (1999) si este Doctor in stiinte istorice (2010). Lucreaza cu copiii de gimnaziu si de liceu de peste 16 ani. De asemenea, Dragos a urmat cursuri de gandire critica si formare psiho-pedagogica, fiind organizatorul a numeroase activitati legate de educatie cu profesori si copii din tara si Uniunea Europeana.

Este mentor Kogaion Gifted Academy din anul 2016.`,
		bioEn: null,
		image: '/media/uploads/mentori/dragos-marinescu.webp',
		yearJoined: 2016,
		sortOrder: 26
	},
	{
		slug: 'andra-visan',
		nameRo: 'Andra Vișan',
		nameEn: 'Andra Vișan',
		titleRo: 'Solistă vocală, muzician multi-instrumentist medicine songs',
		titleEn: 'Vocal soloist, multi-instrumentalist musician, medicine songs',
		bioRo: `Muzica a intrat în viața Andrei înca de la vârsta de 5 ani, când a început să experimenteze diferite instrumente, însă abia în 2018 a fost fructificată această pasiune când și-a cumpărat primul frame-drum. De atunci, această pasiune s-a tot dezvoltat, prin instrumente de percuție, hang-drum și boluri cântătoare de cristal. Însă pasiunea ei principală rămâne folosirea vocii drept instrument, compunandu-si propriile cântece. Susține sesiuni de sound-healing, singing circles, practici de deschidere a vocii și cântă în spații ceremoniale, folosind vocea și sunetul drept instrumente holistice.`,
		bioEn: null,
		image: '/media/uploads/mentori/andra-visan.webp',
		yearJoined: null,
		sortOrder: 27
	},
	{
		slug: 'cristian-drimba',
		nameRo: 'Cristian Drîmbă',
		nameEn: 'Cristian Drîmbă',
		titleRo: 'Muzician multi-instrumentist',
		titleEn: 'Multi-instrumentalist musician',
		bioRo: `„De mai bine de 20 de ani, muzica e prezentă zilnic în viața mea. Pentru mine, muzica e entertainment, terapie și un prilej de a aduce oamenii împreună." Cristian a început să cânte la chitară bass din adolescență și a activat în diverse trupe din zona de rock alternativ, cu care a susținut numeroase concerte prin țară și străinătate și alături de care a participat la diverse festivaluri. Începând cu anul 2016 a început sa exploreze muzica ca o unealtă de ritual și vindecare. Colaborează cu alți artiști și terapeuți, creează muzică live, co-facilitează retreaturi de dezvoltare personală, participă la diverse festivaluri de profil și realizează evenimente experimentale ce implică muzică, dans, sau arte vizuale dinamice.

Cristian este pasiont de artele, cultura și filozofiile din subcontinentul Indian și organizează ateliere de cântat mantre (kirtan). Folosește o varietate de fluiere si instrumente de suflat etnice, instrumente de percuție și instrumente cu coarde pentru a crea sonorități meditative. În anul 2018 a început să prindă drag de obiceiurile, folclorul și muzicile tradiționale românești, astfel că a învățat să cânte la instrumente arhaice precum cobză, caval sau tilincă și să faciliteze evenimente de jocuri tradiționale românești pe muzică vie.`,
		bioEn: null,
		image: '/media/uploads/mentori/cristian-drimba.webp',
		yearJoined: null,
		sortOrder: 28
	},
	{
		slug: 'alexandru-mironov',
		nameRo: 'Alexandru Mironov',
		nameEn: 'Alexandru Mironov',
		titleRo: 'Scriitor, jurnalist, vicecampion la scrima',
		titleEn: 'Writer, journalist, fencing vice-champion',
		bioRo: `Alexandru Mironov sau "radio-tele-profesorul" este scriitor si jurnalist, cunoscut pentru bogata activitate de popularizare a stiintei si a "science fiction" in cadrul Radiodifuziunii si Televiziunii Romane. A realizat peste 4.000 de emisiuni si cca 1.000 de articole cu caracter de popularizare a stiintei, fiind unul dintre "inventatorii" si promotorii celebrului Almanah Anticipatia si a Colectiei de Povestiri Stiintifico-Fantastice. A practicat scrima, ajungand vicecampion national, iar in anii '90 a fost presedinte al Federatiei de Scrima. Recent i-a fost acordat titlul de Doctor Honoris Causa al Universitatii Suceava. Este mentor Kogaion Gifted Academy din anul 2015.`,
		bioEn: null,
		image: '/media/uploads/mentori/alexandru-mironov.webp',
		yearJoined: 2015,
		sortOrder: 29
	},
	{
		slug: 'uca-marinescu',
		nameRo: 'Uca Marinescu',
		nameEn: 'Uca Marinescu',
		titleRo: 'Profesor, explorator si sportiv de performanta',
		titleEn: 'Professor, explorer and performance athlete',
		bioRo: `Uca Marinescu este profesor, explorator si sportiv de performanta, detinatoare a numeroase recorduri nationale si mondiale – este prima femeie din lume care a atins toti cei patru poli (geografici si magnetici); este prima romanca, cea de-a treia femeie din lume si prima ca varsta (62 ani) care detine un dublu record mondial prin atingerea Polului Nord si a Polului Sud pe schiuri; de asemenea, este prima romanca ce a ajuns in Antarctica.

Doamnei Uca Marinescu i-au fost acordate numeroase distinctii pe plan intern si international, cum ar fi Diploma de excelenta din partea Comitetului Olimpic Roman si a Comitetului International Olimpic, Ordinul National de Merit in Grad de Cavaler oferit de Presedintele Romaniei, fiind totodata membra a Societatii Romane de Geografie si a Asociatiei Americane de Geografie.

Este mentor Kogaion Gifted Academy din anul 2016.`,
		bioEn: null,
		image: '/media/uploads/mentori/uca-marinescu.webp',
		yearJoined: 2016,
		sortOrder: 30
	},
	{
		slug: 'roberto-stan',
		nameRo: 'Roberto Stan',
		nameEn: 'Roberto Stan',
		titleRo: 'Director de imagine',
		titleEn: 'Director of photography',
		bioRo: `Am absolvit în anul 2016 UNATC ca director de imagine și de atunci mă dezvolt continuu. Am realizat nenumărate proiecte frumoase, de la clipuri muzicale la reclame, scurtmetraje și lungmetraje. Îmi place să creez și mă consider o persoană comunicativă și empatică. Îmi iubesc job-ul și tot ce tine de cinematografie.

Este mentor Kogaion Gifted Academy din anul 2023.`,
		bioEn: null,
		image: '/media/uploads/mentori/roberto-stan.webp',
		yearJoined: 2023,
		sortOrder: 31
	},
	{
		slug: 'constantin-caprioreanu',
		nameRo: 'Constantin Căprioreanu',
		nameEn: 'Constantin Căprioreanu',
		titleRo: 'Ghid montan',
		titleEn: 'Mountain guide',
		bioRo: `Costi este ghid montan la Christian Adventure, mentor și coordonator în tabere cu copii, atât în perioada verii cât și în perioada iernii, cu o experiență de peste 7 ani în lucrul cu copiii. Costi este o fire entuziastă, pasionat de chitară, cântece și povești pentru copii, munte, frumos, natură. Pentru el tabăra este un basm, o călătorie de poveste, un prilej de a da mai departe copiilor din ceea ce este. Se simte în largul lui cu copiii și are abilități de gestionare a conflictelor și a situațiilor tensionate dintre ei, ajutându-i cu calm si blândețe să înțeleagă contextul creat. Motto-ul lui este "Trăiesc viața clipă de clipă, din suflet, cu tot trupul zâmbind" iar în ultimii ani spune: "Fac ceea ce simt că într-adevăr mă face să mă simt bine".

Este mentor Kogaion Gifted Academy din anul 2021.`,
		bioEn: null,
		image: '/media/uploads/mentori/constantin-caprioreanu.webp',
		yearJoined: 2021,
		sortOrder: 32
	},
	{
		slug: 'christopher-hermann',
		nameRo: 'Christopher Hermann',
		nameEn: 'Christopher Hermann',
		titleRo: 'Antreprenor, jurist si instructor de autoaparare',
		titleEn: 'Entrepreneur, lawyer and self-defense instructor',
		bioRo: `Christopher este in prezent antreprenor, conducand o firma de business development, pentru companii straine in Romania si pentru companii romanesti in strainatate. La baza este jurist, cu master în ştiinţe penale si studii in pedagogie, avand specializări în străinătate: Londra, Viena, Berlin, Haga, Varsovia.

El a inceput cursurile de autoaparare Hapkido la varsta de 6 ani, a devenit instructor ulterior si a dezvoltat abilități pedagogice si tehnice în peste 10 ani de predare. In anul 2016 a fost numit reprezentant oficial al asociatiei "International Hap-Ki-Do Dan- Federation" în România. Este convins ca practicarea artei martiale Hapkido inca din copilarie l-a ajutat sa-si construiasca un fundament solid, care l-a ajutat de-a lungul vietii, in special in plan social si profesional. Acest fundament cuprinde, printre altele: insusirea un set de valori sanatoase (disciplina, respect, empatie, corectitudine, integritate etc) dezvoltarea personalitatii, starnirea ambitiei, consolidarea increderii in sine, puterea si intelepciunea de a preveni (sau la nevoie) de a depasi obstacole fizice/mentale in viata si bineinteles capacitatea de autoaparare fizica, dar nu violent si fara limite, ci intr-un mod uman, atat cat este necesar sa te aperi, protejandu-te pe tine, dar si pe agresor, pe cat posibil, intelegand ca atacatorul este la randul lui o viata ca si tine. Unul dintre principiile noastre este: _Nu ataca niciodata, dar NU te lasa niciodata atacat._ Este mentor Kogaion Gifted Academy din anul 2023.`,
		bioEn: null,
		image: '/media/uploads/mentori/christopher-hermann.webp',
		yearJoined: 2023,
		sortOrder: 33
	}
];
