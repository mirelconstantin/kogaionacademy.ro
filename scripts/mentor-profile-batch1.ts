/**
 * Mentor profile content, batch 1 of 3.
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

export const mentorProfileBatch1: MentorProfileContent[] = [
	{
		slug: 'adriana-calugaru',
		role: 'Profesor biologie și consilier educațional',
		short:
			'Profesor de biologie cu peste 15 ani lângă elevi, Adriana Călugăru combină rigoarea științifică cu grija pentru modul în care un copil învață. La Kogaion lucrează la primii pași în învățare, cu răbdare și încredere.',
		about:
			'Pentru Adriana Călugăru, lucrul cu copiii nu este doar o profesie, ci o chemare. De peste 15 ani este alături de elevi, ghidându-i cu răbdare, încredere și grijă pentru ritmul fiecăruia. Și-a construit formația în biologie la Universitatea București, completată cu un master în biologie și chimie la Universitatea Politehnică București și cu pregătire pedagogică. Experiența ei include activitatea la clasă, dar și roluri de coordonare și conducere în mediul educațional, unde a lucrat îndeaproape cu copii, părinți și profesori pentru a construi un mediu echilibrat și motivant. Ea urmărește nu doar ce învață un copil, ci cum învață și de ce are nevoie ca să se simtă în siguranță.',
		kogaion:
			'În cadrul Kogaion Gifted Academy, Adriana alege să se întoarcă la esența lucrului cu copiii: primii pași ai copilului în învățare. Acolo pune la bază ce știe despre biologie și despre felul în care un copil învață, adaptând explicațiile la ritmul fiecăruia. Urmărește ca fiecare copil să înțeleagă de ce are nevoie să se simtă în siguranță pentru a învăța cu bucurie. Consideră că fiecare copil are un potențial extraordinar, care nu trebuie grăbit, ci înțeles și încurajat cu răbdere. Dorința ei: fiecare copil să plece de aici cu încredere și cu pofta de a învăța mai departe.',
		quote:
			'Uneori, cel mai important lucru nu este cât învață un copil, ci cât de mult ajunge să iubească învățarea. Lucrul cu copiii este, pentru mine, mai mult decât o profesie: este o chemare.',
		expertise: ['Biologie', 'Consilier educațional', 'Coordonare educațională', 'Predare școlară']
	},
	{
		slug: 'alina-monica-antoci',
		role: 'Mentor comunicare strategică și leadership',
		short:
			'Din 2004, Alina Antoci lucrează la Grupul Băncii Mondiale, sprijinind țările să-și îmbunătățească competitivitatea. Cu o formare matematică și o carieră în politici publice, la Kogaion îi ajută pe lideri să comunice clar și să gândească critic.',
		about:
			'Alina Antoci este expert specialist în Departamentul de Comerț, Competitivitate și Afaceri al Grupului Băncii Mondiale, unde activează din 2004. Experiența ei cuprinde politici publice, comerț internațional, analiză strategică și leadership instituțional, în sprijinul îmbunătățirii competitivității comerciale și a mediului de afaceri. Este licențiată în Matematică și Tehnologia Informației, cu specializare în Cercetare Operațională și Statistică, a urmat un program executiv în Politică și Administrare Fiscală Internațională la Facultatea de Drept a Universității Harvard și a obținut un master în Administrație Publică, Comerț Internațional și Finanțe la John F. Kennedy School of Government. Formarea continuă a inclus programe de specializare în comunicare strategică, leadership și managementul schimbării.',
		kogaion:
			'Din 2025, Alina este mentor colaborator Kogaion, unde susține dezvoltarea liderilor și profesioniștilor prin mentorat aplicat. Lucrează cu comunicare strategică, gândire critică și leadership autentic: cum se explică o decizie complexă fără să se piardă esența, cum se construiește influență într-o echipă și cum se conduce schimbarea. Experiența ei la Grupul Băncii Mondiale, unde politicile publice se traduc în măsuri aplicabile pentru țări și mediul de afaceri, oferă un reper concret. Obiectivul ei este ca fiecare participant să plece cu un limbaj mai clar și cu încredere în propriul leadership.',
		quote:
			'Pentru mine, comunicarea înseamnă să faci limpe deciziile complexe. La Grupul Băncii Mondiale am lucrat cu influență strategică și leadership în organizații internaționale, iar în mentorat încerc să transmit exact asta: claritate înainte de toate, apoi influență, apoi leadership autentic.',
		expertise: [
			'Comunicare strategică',
			'Leadership',
			'Gândire critică',
			'Analiză strategică',
			'Politici publice'
		]
	},
	{
		slug: 'alvina-turcoman',
		role: 'Arhitect și specialist în spații senzoriale',
		short:
			'Arhitect absolvent de „Ion Mincu”, Alvina Turcoman privește spațiile ca pe un mediu care ne influențează gândirea și emoțiile. Iar teza ei de cercetare a întrebat exact asta: cum influențează arhitectura dezvoltarea cognitivă a copiilor.',
		about:
			'Alvina Turcoman este absolventă a Universității de Arhitectură și Urbanism „Ion Mincu”. Ca arhitect, și-a propus să introducă latura psihologică și umană în proiectele ei, iar încă din facultate a arătat interes pentru spații care exploatează zona senzorială. Ea pornește de la premisa că spațiile construite influențează modul în care oamenii gândesc, simt și interacționează cu mediul înconjurător, iar teza ei de cercetare a urmărit influența arhitecturii asupra dezvoltării cognitive a copiilor. Pentru ea, viitorul societății este reprezentat de copii, care au nevoie de toată atenția adulților ca să se dezvolte armonios, fizic și emoțional. S-a implicat în numeroase proiecte cu copii, cel mai reprezentativ fiind voluntariatul la „Salvați Copiii”.',
		kogaion:
			'În Kogaion, Alvina aduce în fața copiilor o perspectivă mai rară: aceea a spațiului. Lucrează cu felul în care mediul înconjurător ne influențează gândirea, emoțiile și atenția, o întrebare pe care teza ei de cercetare a urmărit-o tocmai la copii. Pentru ea, arhitectura nu înseamnă doar clădiri, ci ce simte și cum înțelege un copil un spațiu. Activitatea anterioară la „Salvați Copiii” îi aduce o înțelegere practică a psihologiei copilului, care se răsfrânge în modul în care adaptează explicațiile la vârstă și la experiența celor mici.',
		quote:
			'Eu cred că viitorul societății este reprezentat de copii, iar ei au nevoie de toată atenția noastră ca să se dezvolte corect și armonios. De aceea am ales să aduc latura psihologică și umană în proiectele mele: un spațiu nu e doar o clădire, e un mediu care ne formează.',
		expertise: [
			'Arhitectură',
			'Design senzorial',
			'Psihologia spațiului',
			'Dezvoltare cognitivă',
			'Voluntariat pentru copii'
		]
	},
	{
		slug: 'andrei-stan',
		role: 'Regizor, fotograf și creativity coach',
		short:
			'Fotograf, regizor și artist multidisciplinar, Andrei Stan a lucrat cu artiști precum Alina Eremia și a realizat documentarul „The pursuit of dreams”. Co-fondator al Bucharest Collage Collective, susține din 2014 programe de dezvoltare creativă pentru copii și adulți.',
		about:
			'Andrei Stan este artist multidisciplinar și creativity coach, originar din București. A început ca fotograf, dar și-a continuat călătoria artistică prin dans, actorie, regie de teatru și film, apoi prin artă vizuală, muzică și poezie. A urmat cursurile SNSPA și de regie la Met Film School din Londra, unde și-a confirmat pasiunea pentru film și artă. A lucrat cu artiști precum Șerban Cazan, Alina Eremia și Alexandra Stan, iar documentarul „The pursuit of dreams” l-a adus în scenă alături de speakeri internaționali precum Gregg Braden, Joe Dispenza și Bruce Lipton. Din 2014 susține programe de dezvoltare creativă pentru copii și adulți.',
		kogaion:
			'În Kogaion Gifted Academy, Andrei lucrează cu creativitatea ca materie de învățare. Atelierele sale pornesc de la gest, de la imagine și de la sunet, ca fiecare copil să poată construi ceva propriu, fără să se compare cu altcineva. Experiența lui de fotograf, regizor și artist multidisciplinar îi permite să combine surse vizuale diferite într-un discurs coerent, iar activitatea de creativity coach îi aduce o metodă clară de a lucra cu copiii și adulții. Ce urmărește: să-i ajute pe cei mici să observe mai atent, să încerce fără teama de greșeală și să spună povestea cum îi place.',
		quote:
			'Eu am pornit ca fotograf și am continuat cu dans, actorie, regie, muzică și poezie. De atunci am înțeles că o formă artistică se poate transforma în alta, așa cum se transformă un copil când are voie să experimenteze. De aceea lucrez cu creativitatea: copiii au nevoie de spațiu, nu de lecții.',
		expertise: [
			'Fotografie',
			'Regie de film',
			'Artă colajului',
			'Dezvoltare creativă',
			'Arta interdisciplinară'
		]
	},
	{
		slug: 'andreea-draghici',
		role: 'Biolog și cercetător',
		short:
			'Licențiată în biologie, cu master în Biochimie și Biologie Moleculară, Andreea Drăghici lucrează în cercetare și în teren, fiind colaborator la Muzeul Național „G. Antipa”. Aduce științele naturii lângă copii, prin conferințe, cursuri și școli de vară.',
		about:
			'Andreea Drăghici este licențiată în biologie, cu un modul de psihopedagogie inclus în pregătirea universitară, și deține un master în Biochimie și Biologie Moleculară, alături de alte formări adiacente. Lucrează în cercetare, dar are și activitate în teren, împletind partea teoretică și practică într-un mod armonios și simplu. Are experiență în programe pentru copii, de la conferințe și cursuri la școlile de vară, și este colaborator la Muzeul Național „G. Antipa”. Ceea ce o motivează cel mai mult: dragul de copii și dorința de a le transmite pasiunea pentru științele naturii.',
		kogaion:
			'În Kogaion Gifted Academy, Andreea îi ajută pe copii să descopere științele naturii pornind de la întrebări, nu de la răspunsuri gata. Lucrează cu explicații simple și cu dovezi observabile, ca un experiment de teren sau o observație de laborator să devină o experiență pe care copilul o poate atinge. Experiența ei de cercetare și de teren arată unde trebuie făcută întrebarea, iar cea de la Muzeul Național „G. Antipa” arată cum poate fi transformată într-un program educațional. Obiectivul ei: să transmită mai departe copiilor bucuria de a întreba.',
		quote:
			'Eu lucrez în cercetare, dar și în teren, pentru că o parte din răspunsuri se văd doar când ieși afară cu copiii. Ce urmăresc e să le transmit pasiunea pentru științele naturii, cu orice prilej. Am un mare drag de copii, și asta se vede în fiecare conferință, curs sau școală de vară.',
		expertise: [
			'Biologie',
			'Biochimie',
			'Biologie moleculară',
			'Cercetare de teren',
			'Științe pentru copii'
		]
	},
	{
		slug: 'andreea-faur',
		role: 'Psiholog în programele Kogaion',
		short:
			'Asistent social, licențiată în psihologie și doctor în sociologie, Andreea Faur lucrează cu adicțiile și cu delincvența juvenilă. Crede că fiecare copil are un potențial uriaș și că adultul trebuie să-l ajute să-l scoată la lumină.',
		about:
			'Andreea Faur are o pregătire largă: absolventă a Liceului Pedagogic, specializarea educator-învățător, cu definitivat în învățământul preșcolar, licențiată în asistență socială și psihologie și doctor în sociologie. Este formator pe programe cognitiv-comportamentale, de grup și individuale, și are o vastă experiență în psihodramă și în medierea relației dintre adulți și copiii cu delincvență juvenilă. În prezent este consilier de probațiune, formator în lucrul cu persoanele cu adicții și expert internațional în comunități terapeutice pentru persoane cu adicții, copii și adulți. Colateral, acordă atenție și dezvoltării copiilor, pentru care rolul de educator rămâne la fel de important.',
		kogaion:
			'În Kogaion, Andreea lucrează ca psiholog în programele cu copii. Acolo folosește ce a învățat lucrând cu adicții, cu delincvență juvenilă și în comunități terapeutice, dar îl aduce la o altă scară: lucrul cu un copil aflat într-o situație de risc, în care relația de încredere se construiește încet, prin joc, prin povești și prin stabilitate. Formarea ei ca educator-învățător îi dă o lectură a nevoilor de dezvoltare ale copilului, iar cea în psihodramă și în mediere îi oferă instrumente de lucru cu grupul. Crede în schimbare și în potențialul uriaș al fiecărui copil.',
		quote:
			'Eu cred în schimbare și în potențialul uriaș pe care fiecare copil îl are. Adultul trebuie să învețe să scoată la lumină copilul frumos din interiorul lui. Ceea ce dă sens vieții este să pui în inimă în fiecare zi un răsărit de soare.',
		expertise: ['Psihologie', 'Psihodramă', 'Mediere', 'Asistență socială', 'Adicții']
	},
	{
		slug: 'andra-nineta-nenciu',
		role: 'Artist plastic, fotograf și designer de interior',
		short:
			'Absolventă a Secției grafică a Universității Naționale de Arte, Andra Nineta Nenciu conduce conceptul „Pictam Vise”. Cu peste 10 ani de experiență în pictură și design, a expus în țară și în străinătate și lucrează de mult cu copiii.',
		about:
			'Andra Nineta Nenciu este absolventă a Universității Naționale de Arte din București, cu un master la Secția grafică. Are peste 10 ani de experiență în pictură, concept și graphic design, este specializată în tehnica prelucrării imaginii cu Adobe Photoshop și lucrează în design ambiental, pictură pe pereți, textile și piele, lemn și sticlă, gravură și reprezentare plastică. Este fondatorul și coordonatorul conceptului „Pictam Vise”. A participat la expoziții în țară și în străinătate, inclusiv cu expoziții de grup și personale de gravură în București și la Muzeul Județean de Artă Prahova, și a primit Premiul „Suvenir de București” și Premiul I la concursul „Icoana din sufletul copilului”, al Patriarhiei Române.',
		kogaion:
			'În Kogaion Gifted Academy, Andra lucrează cu copii de ani lungi, iar ce aduce aici are de-a lungul experienței sale artistice: un ochi pentru formă, culoare și compoziție. Atelierele ei urmăresc să-i ajute pe copii să vadă lucrurile altfel, să observe detalii, să-și construiască propriul discurs vizual și să înțeleagă că o imagine bună poate porni de la orice. Experiența de lungă durată cu copiii contează aici la fel de mult ca Premiul „Suvenir de București” sau expozițiile de gravură. Obiectivul ei: să-i ajute să descopere că pot crea.',
		quote:
			'Lucrez cu copiii de mult timp, iar Premiul I la concursul „Icoana din sufletul copilului”, al Patriarhiei Române, mi-a spus ce înseamnă să lucrezi cu ei. Am coordonat conceptul „Pictam Vise”, iar acolo am învățat că desenul nu se explică, se învață. Îmi place să îi văd descoperind cum se construiește o imagine.',
		expertise: ['Pictură', 'Graphic design', 'Fotografie', 'Design interior', 'Tehnici grafice']
	},
	{
		slug: 'andra-visan',
		role: 'Solistă vocală și muziciană multi-instrumentistă',
		short:
			'Andra Vișan folosește vocea ca instrument principal și își compune propriile cântece. De la primul frame-drum, cumpărat în 2018, a dezvoltat un repertoriu de percuție și hang-drum, pe care îl duce în sesiuni de sound-healing și în spații ceremoniale.',
		about:
			'Andra Vișan a început să experimenteze muzica de la vârsta de 5 ani, când a pus mâna pe primele instrumente. Pasiunea s-a maturizat în 2018, când și-a cumpărat primul frame-drum, iar de atunci a explorat constant instrumentele de percuție, hang-drum și bolurile cântătoare de cristal. Pasiunea ei principală rămâne însă vocea, folosită ca instrument: își compune propriile cântece și le duce în fața publicului. Susține sesiuni de sound-healing, singing circles și practici de deschidere a vocii, și cântă în spații ceremoniale, folosind vocea și sunetul drept instrumente holistice.',
		kogaion:
			'În Kogaion, Andra lucrează cu vocea ca instrument de învățare, nu doar de performanță. Practicile de deschidere a vocii și cântul în grup oferă copiilor și tinerilor un limbaj pe care îl pot folosi imediat: să se asculte, să-și asculte corpul, să regăsească ritmul și să se conecteze între ei prin sunet. Cântecele proprii oferă un exemplu viu de cum se poate porni de la o emoție și transforma într-o melodie. Prin sound-healing, singing circles și spații ceremoniale, ea lucrează la ascultare, prezență și liniște, competențe care ajută un copil să se regăsească într-un grup și să-și asume vocea.',
		quote:
			'Eu continui să compun și eu continui să cânt. Vocea e instrumentul principal, iar cântecele mele pornesc întotdeauna dintr-o trăire pe care încerc să o transmit mai departe. Am pornit de la cinci ani cu primele instrumente și am ajuns la locul unde vocea și sunetul sunt, pentru mine, instrumente holistice.',
		expertise: ['Voce', 'Sound healing', 'Compoziție muzicală', 'Percuție', 'Cânt în grup']
	},
	{
		slug: 'bianca-gabriela-balan',
		role: 'Artist multidisciplinar și designer',
		short:
			'Autodidactă într-o artă de orice natură, Bianca Bălan lucrează cu pictură, murală, tâmplărie, arhitectură, mobilier din lemn, muzică instrumentală și design vestimentar. Își dorește să transmită mai departe o artă care stă pe spontaneitate, creativitate și unicitate.',
		about:
			'Bianca Gabriela Bălan spune despre sine că s-a născut înzestrată cu diverse aptitudini și talente, cele mai evidente fiind de natură artistică, alături de observare interioară și socializare. A ales însă să studieze științele naturii, matematica și informatica, pentru ca talentul artistic să se dezvolte într-un mod original și unic. Experiența ei în arte de orice natură, de la pictură și pictură murală la tâmplărie, arhitectură, design, proiectare și prelucrare de mobilă din lemn, construcții, muzică instrumentală și design vestimentar, este complet autodidactă, clădită prin observație profundă, atât interioară, cât și exterioară, și în continuă dezvoltare, în armonie cu tot ce o înconjoară.',
		kogaion:
			'În Kogaion, Bianca lucrează cu ideea că fiecare copil are o combinație proprie de aptitudini. Fie că atinge vopsea, lut, lemn sau un instrument, copilul învață prin a face, nu din teorie. Experiența ei autodidactă o face să nu caute rețete, ci să observe ce funcționează pentru fiecare copil și să construiască de acolo. Arta, în viziunea ei, are la bază spontaneitatea, creativitatea și unicitatea personală a fiecăruia, iar acestea sunt exact lucrurile pe care le învață copiii când creează. Obiectivul ei la Kogaion: să transmită mai departe deschiderea spre o artă care pornește din interior.',
		quote:
			'Eu m-am născut înzestrată cu diverse aptitudini, iar cele mai evidente au fost de natură artistică. Am ales să studiez științele naturii, matematica și informatica, ca talentul artistic să se dezvolte într-un mod original și unic. Obiectivul meu e să transmit mai departe arta care stă pe spontaneitate, creativitate și unicitatea fiecăruia.',
		expertise: [
			'Artă multidisciplinară',
			'Design vestimentar',
			'Mobilier din lemn',
			'Pictură murală',
			'Muzică instrumentală'
		]
	},
	{
		slug: 'ciprian-vantdevara',
		role: 'Astronom și cercetător',
		short:
			'Astronom absolvent de Geografie la Universitatea din Galați și coordonator al Astroclubului „Perseus” din Bârlad, Ciprian Vântdevară are peste un deceniu de cursuri și ateliere de astronomie. A descoperit stele confirmate oficial în baza de date VSX a AAVSO.',
		about:
			'Ciprian Vântdevară este absolvent al Facultății de Geografie a Universității din Galați și coordonator al Astroclubului „Perseus”, din cadrul Observatorului Astronomic al Muzeului „Vasile Pârvan” din Bârlad. Are o experiență de peste un deceniu în susținerea de cursuri, ateliere, prezentări și evenimente cu tematică astronomică. Activitatea sa științifică este remarcabilă: a descoperit mai multe stele, între care o nova roșie luminoasă, în 10 februarie 2015, și, recent, în 7 aprilie 2026, un sistem binar format dintr-o pitică portocalie și o pitică roșie. Descoperirile sale au fost confirmate oficial în baza de date internațională VSX a Asociației Americane a Observatorilor de Stele Variabile.',
		kogaion:
			'În Kogaion Gifted Academy, Ciprian lucrează cu astronomia ca experiență, nu doar ca informație. Poveștește despre cer copiilor pornind de la ce pot vedea cu ochiul liber, de la lună și de la planete, iar apoi îi duce spre telescop și spre întrebările la care doar observatorul răspunde. Experiența lui de peste un deceniu în cursuri, ateliere și prezentări arată ce limbaj funcționează cu copiii, iar munca de cercetare le oferă un exemplu viu de cum se verifică o ipoteză. Obiectivul său: să-i învețe pe cei mici să se uite în sus și să-și pună întrebări bine formulate.',
		quote:
			'Eu am început cu cerul, ca temă de curs și de atelier, și am ajuns la observator. Cu copiii pornesc întotdeauna de la ce pot vedea cu ochiul liber, pentru că o stea confirmată oficial începe cu o privire atentă, nu cu o formulă. Îi învăț să se uite în sus și să întrebe.',
		expertise: [
			'Astronomie',
			'Cercetare astronomică',
			'Observație vizuală',
			'Ateliere pentru copii'
		]
	},
	{
		slug: 'constantin-caprioreanu',
		role: 'Ghid montan și coordonator de tabere',
		short:
			'Ghid montan la Christian Adventure și coordonator de tabere cu copii de peste 7 ani, Costi Căprioreanu folosește cântecul, basmul și natura ca limbaj comun. Știe să gestioneze conflictele cu calm și blândețe, păstrând mereu sensul aventurii.',
		about:
			'Costi Căprioreanu este ghid montan la Christian Adventure și mentor coordonator în tabere cu copii, atât în perioada verii, cât și a iernii, cu o experiență de peste 7 ani în lucrul cu copiii. Este o fire entuziastă, pasionată de chitară, de cântece și de povești pentru copii, de munte, de frumos și de natură. Se simte în largul lui cu copiii și are abilități de gestionare a conflictelor și a situațiilor tensionate dintre ei, ajutându-i cu calm și blândețe să înțeleagă contextul creat. Motto-ul lui spune tot despre felul în care trăiește: trăiește viața clipă de clipă, din suflet, cu tot trupul zâmbind.',
		kogaion:
			'În Kogaion Gifted Academy, Costi coordonează tabere în care fiecare zi începe și se încheie cu un cântec, o poveste sau o întrebare în aer liber. Lucrează cu dinamica grupului: cum se formează echipa, cum se rezolvă tensiunile dintre copii și cum se transformă o zi de mers într-o experiență de care își amintesc mult. Experiența lui de ghid montan îi dă siguranța de a improviza, iar cea de 7 ani în tabere îi dă lectura exactă a momentelor în care un copil are nevoie de o poveste și a celor în care are nevoie doar de liniște.',
		quote:
			'Eu trăiesc viața clipă de clipă, din suflet, cu tot trupul zâmbind. Fac ceea ce simt că într-adevăr mă face să mă simt bine. Tabăra, pentru mine, este un basm, o călătorie de poveste și un prilej de a da mai departe copiilor din ceea ce este.',
		expertise: [
			'Ghid montan',
			'Tabere cu copii',
			'Coordonare de grup',
			'Povești și cântece',
			'Gestionarea conflictelor'
		]
	},
	{
		slug: 'cristian-drimba',
		role: 'Muzician multi-instrumentist și facilitator',
		short:
			'De peste 20 de ani în muzică, Cristian Drîmbă a trecut de la chitara bass la muzica ca ritual și vindecare. Organizează ateliere de kirtan, cântă la cobză, caval și tilincă și facilitează jocuri tradiționale pe muzică vie.',
		about:
			'Cristian Drîmbă este muzician multi-instrumentist, prezent zilnic în viața lui de mai bine de 20 de ani. A început să cânte la chitară bass din adolescență și a activat în trupe din zona rock alternativ, cu care a susținut concerte în țară și în străinătate și a participat la diverse festivaluri. Din 2016 explorează muzica ca unealtă de ritual și vindecare: colaborează cu alți artiști și terapeuți, creează muzică live, co-facilitează retreaturi de dezvoltare personală și realizează evenimente experimentale care implică muzică, dans sau arte vizuale dinamice. Din 2018 s-a apropiat și de obiceiurile și muzicile tradiționale românești, învățând să cânte la cobză, caval și tilincă.',
		kogaion:
			'În Kogaion, Cristian lucrează cu muzica ca instrument de grup. Organizează ateliere de cântat mantre și facilitează jocuri tradiționale românești pe muzică vie, aducând împreună două lumi pe care le are în practică: repertoriile meditative, de inspirație indiană, și pe cele arhaice românești, precum cobza, cavalul sau tilinca. Pentru copii, muzica oferă o cale simplă de a intra în grup, de a-și regla corpul și respirația și de a participa prin propriul ritm, chiar dacă nu cântă la perfecțiune. Experiența lui de concert se traduce în seriozitate și în grija de a-i lăsa pe cei mici să fie auziți.',
		quote:
			'De mai bine de 20 de ani muzica e prezentă zilnic în viața mea. Pentru mine, muzica e entertainment, terapie și un prilej de a aduce oamenii împreună. De aceea eu caut întotdeauna muzica live: sunetul adevărat se naște când oamenii cântă în același loc.',
		expertise: [
			'Muzică multi-instrumentistă',
			'Kirtan și mantre',
			'Muzică tradițională românească',
			'Sound healing',
			'Evenimente live'
		]
	},
	{
		slug: 'cristina-isabela-beteringhe',
		role: 'Violonistă și profesoară de muzică',
		short:
			'Violonistă formată în România și la Filharmonie Noord din Groningen, Cristina Beteringhe a înregistrat patru albume de studio și a lucrat la muzica unui film Charlie Chaplin. Astăzi lucrează la primul EP și predă vioară și pian.',
		about:
			'Cristina Isabela Beteringhe cântă la vioară de la vârsta de 6 ani. A studiat muzica clasică în România până la 23 de ani, când, dornică de noi orizonturi, s-a mutat în Olanda. Acolo, 5 ani, a fost violonistă în Orchestra Filharmonie Noord din Groningen, la Opera Spanga, Friesland, a înregistrat 4 albume de studio și a susținut proiecte speciale cu alți artiști. Pe lângă ansamblurile clasice, a colaborat cu trupe de jazz și pop-rock experimental și cu compozitori moderni, inclusiv în proiecte pentru film și teatru, printre care trupa de teatru „Different Trains”, Groningen, și coloana sonoră pentru filmul „The Kid” de Charlie Chaplin. În prezent lucrează la primul ei EP, în calitate de singer-songwriter.',
		kogaion:
			'În Kogaion Gifted Academy, Cristina lucrează cu muzica ca limbaj și ca joc. Pentru copii și tineri, cântul la un instrument înseamnă mai mult decât o performanță: înseamnă să te asculți, să îți asumi o provocare și să simți bucuria de a te conecta cu ceilalți. Din experiența sa de concert îi aduce ideea de a exersa creativitatea împreună, nu doar individual, iar cea de pedagogie, de a transforma orice moment de practică într-un pretext de încredere. În muzica ei, cu jazzul și cu pop-rockul experimental, există loc pentru orice nivel și pentru orice ritm.',
		quote:
			'Influența artei, a muzicii în special, a cunoașterii limbajului muzical și a exersării creativității contribuie enorm la dezvoltarea noastră, la încrederea cu care ne asumăm provocările și la bucuria de a ne conecta cu ceilalți. Am venit acasă cu dorința de a împărtăși din lucrurile frumoase pe care le-am învățat.',
		expertise: ['Vioară', 'Pian', 'Muzică clasică', 'Jazz', 'Predare muzicală']
	},
	{
		slug: 'diana-antoci',
		role: 'Fondatoare Kogaion Gifted Academy',
		short:
			'Din 2013, Diana Antoci conduce alături de prof. dr. Florian Colceag centrul de enrichment Kogaion Gifted Academy, unde a conceput programe educaționale în premieră în România. Mamă a două fete, formată în psihopedagogia excelentei, lucrează cu familia și cu gândirea.',
		about:
			'Diana Antoci este mamă a două fete, vizionară și autodidactă, cu multă pasiune și dăruire pentru ceea ce face. Din 2013 a fondat împreună cu prof. dr. Florian Colceag centrul de enrichment Kogaion Gifted Academy, în cadrul căruia a conceput numeroase programe educaționale în premieră pentru educația din România: dezvoltare personală adresată familiei, afterschool cu curriculă integrată, enrichment intensiv de identificare a abilităților copiilor și dezvoltarea inteligențelor multiple prin proiecte transdisciplinare. Este licențiată în Economie și Relații Internaționale și a absolvit cursurile Facultății de Psihologie Titu Maiorescu București. A urmat numeroase formări cu prof. dr. Florian Colceag și cu prof. dr. Florin Munteanu, precum și cursuri de wellbeing, medicină holistică și alimentație naturală.',
		kogaion:
			'Diana a fondat și conduce Kogaion Gifted Academy împreună cu prof. dr. Florian Colceag, iar acolo a conceput programe educaționale în premieră în România: dezvoltare personală adresată familiei, afterschool cu curriculă integrată, enrichment intensiv de identificare a abilităților copiilor și dezvoltarea inteligențelor multiple prin proiecte transdisciplinare. Lucrează cu copiii și cu părinții lor deopotrivă, convinsă că relația dintre copil și părinte stă la baza învățării. Forma sa în psihopedagogia excelentei îi oferă instrumentele, iar familia din care vine, cu tradiție de generații în educație, îi dă răspunsul la întrebarea de unde începe lucrul cu un copil.',
		quote:
			'Perfecțiunea și frumusețea naturii, a viului, a Omului, copiii și relațiile pe care le formează cu noua lume m-au fascinat dintotdeauna. Sunt mamă a două fete și lucrez cu copiii de peste un deceniu, într-o familie cu tradiție de generații în educație. Pentru mine, a învăța înseamnă mai întâi a înțelege.',
		expertise: [
			'Psihopedagogie',
			'Metoda Feuerstein',
			'Inteligențe multiple',
			'Programe de enrichment',
			'Dezvoltare personală'
		]
	},
	{
		slug: 'dumitru-badila',
		role: 'Medic, inventator și cercetător',
		short:
			'Medic de familie și de urgență, specializat în termografie medicală, Dumitru Bădilă este și inventator: Biofotonul, aparat de terapie cu lumina polarizată, și Tunul Sonic antigrindină, ambele în producție. Cercetător, conduce un proiect finanțat din fonduri europene.',
		about:
			'Dumitru Bădilă este absolvent de medicină militară și lucrează ca medic de familie, medic de urgență și în domeniul termografiei medicale. Este, în același timp, cercetător, cu multiple lucrări științifice publicate și prezentate la congrese și simpozioane, și inventator: deține mai multe invenții brevetate în România și o invenție brevetată internațional. Dintre acestea se numără Biofotonul, aparat de terapie cu lumina polarizată, cu brevetul RO120569, și Tunul Sonic antigrindină, cu brevetul european EP3484273, ambele aflate în producție. În prezent este director de cercetare în cadrul ultimului proiect, finanțat din fonduri europene.',
		kogaion:
			'În Kogaion Gifted Academy, Dumitru lucrează cu ce știe despre corpul uman, măsurare și aparatele care pot ajuta. Experiența lui medicală, de la medicina de familie până la termografia medicală, îi oferă o bază concretă pentru a vorbi cu copiii despre corp, sănătate și despre felul în care funcționează un dispozitiv. Ce aduce în plus este latura de cercetător și de inventator: procesul prin care o întrebare științifică devine un brev, o mașină și, la final, un produs aflat în producție. Obiectivul său: să le arate copiilor că întrebările bune se pot transforma în lucruri utile.',
		quote:
			'Eu sunt medic și sunt inventator. Am trecut de la termografia medicală la brevete, de la întrebarea cum funcționează corpul la întrebarea cum ar putea funcționa mai bine. Cele două lucruri, la mine, nu s-au separat niciodată. Îmi place să le arăt copiilor că o curiozitate bine pusă întrebare poate ajunge în producție.',
		expertise: ['Medicină', 'Termografie medicală', 'Cercetare', 'Inventivitate și brevete']
	}
];
