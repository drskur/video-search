use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct IndexTopicMessage {
    pub video_id: String,
    pub lang: String,
    pub body: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ImageFrameEvent{
    pub video_id: String,
    pub video_key: String,
    pub thumbnail_key: String
}