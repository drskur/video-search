use actix_web::error::{ErrorBadRequest, ErrorInternalServerError};
use actix_web::{HttpResponse, web};
use actix_web::get;
use actix_web::http::header::{self};
use anyhow::anyhow;
use askama::Template;
use aws_sdk_kendra::model::{AttributeFilter, DocumentAttribute, DocumentAttributeValue};
use serde::{Deserialize};
use crate::handlers::VideoSearchItem;

#[derive(Template)]
#[template(path = "search.html")]
#[allow(dead_code)]
struct SearchTemplate {
    // content_host: String,
    videos: Vec<VideoSearchItem>
}

impl SearchTemplate {
    pub fn new(videos: Vec<VideoSearchItem>) -> Self {
        SearchTemplate {
            videos
        }
    }
}

#[derive(Deserialize)]
pub struct SearchRequest {
    #[serde(rename = "q")]
    query: String,
    lang: String,
}

#[get("/search")]
pub async fn handler(req: web::Query<SearchRequest>) -> actix_web::Result<HttpResponse> {

    let kendra_index = dotenv::var("KENDRA_INDEX")
        .expect("QUEUE_URL must be set.");
    let shared_config = aws_config::from_env().load().await;
    let kendra = aws_sdk_kendra::Client::new(&shared_config);

    let filter = AttributeFilter::builder()
        .equals_to(DocumentAttribute::builder()
            .key("_language_code")
            .value(DocumentAttributeValue::builder().string_value(&req.lang).build()).build())
        .build();

    let output = kendra.query()
        .index_id(&kendra_index)
        .query_text(&req.query)
        .attribute_filter(filter)
        .requested_document_attributes("video_key")
        .requested_document_attributes("thumbnail_key")
        .page_size(10)
        .send()
        .await
        .unwrap();

    let items = output.result_items.ok_or(anyhow!("result_items must exist"))
        .map_err(|e| ErrorBadRequest(e))?
        .into_iter()
        .map(VideoSearchItem::try_from)
        .map(|r| r.unwrap())
        .collect::<Vec<_>>();

    let html = SearchTemplate::new(items)
        .render()
        .map_err(|e| ErrorInternalServerError(e))?;

    let response = HttpResponse::Ok()
        .content_type(header::ContentType::html())
        .body(html);

    Ok(response)
}

mod filters {
    pub use crate::second_format;
    pub use crate::content_url_opt;
}