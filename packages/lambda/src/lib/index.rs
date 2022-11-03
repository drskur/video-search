use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct IndexTopicMessage {
    pub video_id: String,
    pub lang: String,
    pub body: String,
}