use actix_web::error::ErrorInternalServerError;
use actix_web::HttpResponse;
use actix_web::get;
use actix_web::http::header::{self};
use askama::Template;
use crate::store::video::{scan_videos, VideoItem};

#[derive(Template)]
#[template(path = "index.html")]
#[allow(dead_code)]
struct IndexTemplate {
    content_host: String,
    videos: Vec<VideoItem>
}

impl IndexTemplate {
    pub fn new(videos: Vec<VideoItem>) -> Self {
        IndexTemplate {
            content_host: dotenv::var("CONTENT_HOST").expect("CONTENT_HOST must be set"),
            videos
        }
    }
}

#[get("/")]
pub async fn handler() -> actix_web::Result<HttpResponse> {

    let videos = scan_videos().await.unwrap();

    let html = IndexTemplate::new(videos)
        .render()
        .map_err(|e| ErrorInternalServerError(e))?;

    let response = HttpResponse::Ok()
        .content_type(header::ContentType::html())
        .body(html);

    Ok(response)
}

mod filters {
    #[allow(dead_code)]
    pub fn content_url(key: &Option<String>) -> ::askama::Result<String> {
        let host = dotenv::var("CONTENT_HOST").expect("CONTENT_HOST must be set.");
        if let Some(s) = key {
            Ok(format!("//{}/{}", host, s))
        } else {
            // default thumbnail
            Ok("".to_string())
        }
    }
}