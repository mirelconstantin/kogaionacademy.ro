/** Etichete românești pentru tipuri de evenimente formular (analiză admin). */
const MAP: Record<string, string> = {
	form_view: 'Vizualizare formular',
	form_visible_50: 'Formular vizibil (50% în ecran)',
	first_focus: 'Prima interacțiune (focus)',
	field_change: 'Modificare câmp',
	submit_attempt: 'Încercare de trimitere',
	submit_success: 'Trimitere reușită',
	submit_error: 'Eroare la trimitere',
	validation_error: 'Eroare de validare'
};

export function formEventTypeLabelRo(eventType: string): string {
	return MAP[eventType] ?? eventType;
}
