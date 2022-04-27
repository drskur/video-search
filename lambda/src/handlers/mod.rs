use anyhow::anyhow;
use aws_sdk_kendra::model::QueryResultItem;
use chrono::{NaiveTime, Timelike};
use serde::{Serialize};

pub mod index;
pub mod video_detail;
pub mod search;
pub mod add_subtitle_api;
pub mod video_search_api;

#[derive(Serialize, Debug)]
pub struct VideoSearchItem {
    id: String,
    title: String,
    body: Vec<VideoSearchBody>,
}

impl TryFrom<QueryResultItem> for VideoSearchItem {
    type Error = anyhow::Error;

    fn try_from(value: QueryResultItem) -> Result<Self, Self::Error> {
        let id = value.document_id.ok_or(anyhow!("document_id must exist"))?;
        let title = value.document_title.and_then(|t| t.text).ok_or(anyhow!("document_title must exist"))?;
        let body = value.document_excerpt
            .and_then(|t| t.text)
            .map(|s| s.lines().map(|l| VideoSearchBody::from(l)).collect::<Vec<_>>())
            .ok_or(anyhow!("document_excerpt must exist"))?;

        Ok(VideoSearchItem {
            id,
            title,
            body
        })
    }
}

#[derive(Serialize, Debug)]
struct VideoSearchBody {
    time: u32,
    text: String
}

impl From<&str> for VideoSearchBody {
    fn from(value: &str) -> Self {

        if let Some((first, text)) = value.split_once(" ") {
            if let Ok(time) = NaiveTime::parse_from_str(first, "%T%.3f") {
                VideoSearchBody {
                    time: time.hour() * 3600 + time.minute() * 60 + time.second(),
                    text: text.to_string()
                }
            } else {
                if first.starts_with("...") {
                    VideoSearchBody {
                        time: 0,
                        text: text.to_string()
                    }
                } else {
                    VideoSearchBody {
                        time: 0,
                        text: value.to_string()
                    }
                }
            }
        } else {
            VideoSearchBody {
                time: 0,
                text: value.to_string(),
            }
        }
    }
}