use calimero_sdk::{
    app,
    borsh::{BorshDeserialize, BorshSerialize},
    serde::{Deserialize, Serialize}
};

// Not veri yapısı
#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "calimero_sdk::borsh")]
#[serde(crate = "calimero_sdk::serde")]
pub struct Note {
    id: u64,
    title: String,
    content: String
}

// Olaylar
#[app::event]
pub enum Event {
    NoteCreated(u64),
    NoteUpdated(u64),
    NoteDeleted(u64),
}

// Uygulama Durumu
#[app::state(emits = Event)]
#[derive(Default, BorshDeserialize, BorshSerialize)]
#[borsh(crate = "calimero_sdk::borsh")]
pub struct AppState {
    notes: Vec<Note>,
    next_id: u64, // Not ID'lerini otomatik arttırmak için
}

#[app::logic]
impl AppState {
    #[app::init]
    pub fn init() -> AppState {
        AppState {
            notes: Vec::new(),
            next_id: 1,
        }
    }

    pub fn create_note(
        &mut self,
        title: String,
        content: String,
    ) -> Result<u64, String> {
        let note = Note {
            id: self.next_id,
            title,
            content
        };

        self.notes.push(note);
        app::emit!(Event::NoteCreated(self.next_id));
        self.next_id += 1;

        Ok(self.next_id - 1)
    }

    pub fn list_notes(&self) -> Vec<Note> {
        self.notes.clone()
    }

    pub fn get_note(&self, note_id: u64) -> Result<Note, String> {
        self.notes
            .iter()
            .find(|n| n.id == note_id)
            .cloned()
            .ok_or_else(|| "Note not found".to_string())
    }

    pub fn update_note(
        &mut self,
        note_id: u64,
        new_title: Option<String>,
        new_content: Option<String>,
    ) -> Result<(), String> {
        let note = self
            .notes
            .iter_mut()
            .find(|n| n.id == note_id)
            .ok_or_else(|| "Note not found".to_string())?;

        if let Some(title) = new_title {
            note.title = title;
        }
        if let Some(content) = new_content {
            note.content = content;
        }

        app::emit!(Event::NoteUpdated(note_id));
        Ok(())
    }

    pub fn delete_note(&mut self, note_id: u64) -> Result<(), String> {
        let initial_len = self.notes.len();
        self.notes.retain(|n| n.id != note_id);

        if self.notes.len() == initial_len {
            return Err("Note not found".to_string());
        }

        app::emit!(Event::NoteDeleted(note_id));
        Ok(())
    }
}
