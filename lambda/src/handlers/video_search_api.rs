use actix_web::{HttpResponse, web};
use actix_web::error::ErrorBadRequest;
use actix_web::get;
use anyhow::anyhow;
use aws_sdk_kendra::model::{AttributeFilter, DocumentAttribute, DocumentAttributeValue};
use serde::{Deserialize};
use crate::handlers::VideoSearchItem;

#[derive(Deserialize)]
pub struct VideoSearchRequest {
    #[serde(rename = "q")]
    query: String,
    video_id: Option<String>,
    lang: String,
}

#[get("/api/video/search")]
pub async fn handler(req: web::Query<VideoSearchRequest>) -> actix_web::Result<HttpResponse> {

    let kendra_index = dotenv::var("KENDRA_INDEX")
        .expect("QUEUE_URL must be set.");
    let shared_config = aws_config::from_env().load().await;
    let kendra = aws_sdk_kendra::Client::new(&shared_config);

    let mut filter = AttributeFilter::builder()
        .and_all_filters(
            AttributeFilter::builder()
                .equals_to(DocumentAttribute::builder().key("_language_code").value(DocumentAttributeValue::builder().string_value(&req.lang).build()).build())
                .build()
        );

    if let Some(video_id) = req.video_id.clone() {
        filter = filter.and_all_filters(
            AttributeFilter::builder()
                .equals_to(DocumentAttribute::builder().key("video_id").value(DocumentAttributeValue::builder().string_value(video_id).build()).build())
                .build()
        )
    }

    let output = kendra.query()
        .index_id(&kendra_index)
        .query_text(&req.query)
        .attribute_filter(filter.build())
        .send()
        .await
        .unwrap();

    println!("{:?}", output);

    let items = output.result_items.ok_or(anyhow!("result_items must exist"))
        .map_err(|e| ErrorBadRequest(e))?
        .into_iter()
        .map(VideoSearchItem::try_from)
        .map(|r| r.unwrap())
        .collect::<Vec<_>>();

    let res = HttpResponse::Ok()
        .json(items);

    Ok(res)
}