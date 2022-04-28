use actix_web::error::ErrorInternalServerError;
use actix_web::{HttpResponse, web};
use actix_web::get;
use actix_web::http::header::{self};
use askama::Template;
use crate::store::video::{get_video, VideoItem};
use serde::{Deserialize};

#[derive(Template)]
#[template(path = "video-detail.html")]
#[allow(dead_code)]
struct VideoDetailTemplate {
    video: VideoItem,
    content_host: String,
    timing: f32,
}

impl VideoDetailTemplate {
    pub fn new(video: VideoItem, timing: Option<f32>) -> Self {
        VideoDetailTemplate {
            video,
            content_host: dotenv::var("CONTENT_HOST").expect("CONTENT_HOST must be set"),
            timing: timing.unwrap_or(0.01)
        }
    }
}

#[derive(Deserialize)]
pub struct VideoDetailQuery {
    #[serde(rename = "t")]
    timing: Option<f32>
}

#[get("/video/{id}")]
pub async fn handler(id: web::Path<String>, query: web::Query<VideoDetailQuery>) -> actix_web::Result<HttpResponse> {

    let id = id.into_inner();

    let item = get_video(&id).await.ok();
    if let Some(video) = item {
        let html = VideoDetailTemplate::new(video, query.timing)
            .render()
            .map_err(|e| ErrorInternalServerError(e))?;

        let response = HttpResponse::Ok()
            .content_type(header::ContentType::html())
            .body(html);

        Ok(response)
    } else {
        let response = HttpResponse::NotFound().body(format!("Not found video: {}", &id));

        Ok(response)
    }
}

mod filters {
    pub use crate::*;
}