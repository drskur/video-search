use actix_web::error::ErrorInternalServerError;
use actix_web::{HttpResponse, web};
use actix_web::get;
use actix_web::http::header::{self};
use askama::Template;
use crate::store::video::{get_video, VideoItem};

#[derive(Template)]
#[template(path = "video-detail.html")]
#[allow(dead_code)]
struct VideoDetailTemplate {
    video: VideoItem
}

impl VideoDetailTemplate {
    pub fn new(video: VideoItem) -> Self {
        VideoDetailTemplate {
            video
        }
    }
}

#[get("/video/{id}")]
pub async fn handler(id: web::Path<String>) -> actix_web::Result<HttpResponse> {

    let id = id.into_inner();

    let item = get_video(&id).await.ok();
    if let Some(video) = item {
        let html = VideoDetailTemplate::new(video)
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