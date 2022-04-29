use lambda_runtime::{Error, service_fn, LambdaEvent};
use tantivy::doc;
use serde::{Serialize, Deserialize};
use serde_json::Value;
use tantivy::collector::{TopDocs};
use tantivy::query::QueryParser;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let func = service_fn(handler);
    lambda_runtime::run(func).await?;

    Ok(())
}

#[derive(Serialize, Deserialize)]
struct TantivySearchEvent {
    lang: String,
    query: String
}

async fn handler(event: LambdaEvent<TantivySearchEvent>) -> Result<Vec<Value>, Error> {

    println!("{:?}", serde_json::to_string(&event.payload).unwrap());

    let mount = dotenv::var("TANTIVY_MOUNT")
        .expect("TANTIVY_MOUNT must be set.");

    let schema = lib::tantivy::tantivy_schema(&event.payload.lang);
    let index = lib::tantivy::tantivy_index(&mount, &event.payload.lang)?;
    let video_id_field = schema.get_field("video_id").unwrap();
    let body_field = schema.get_field("body").unwrap();

    let index_reader = index.reader().unwrap();
    let searcher = index_reader.searcher();
    let query_parser = QueryParser::for_index(&index, vec![video_id_field, body_field]);

    let query = query_parser.parse_query(&event.payload.query)?;

    let collector = TopDocs::with_limit(10);
    let top_docs = searcher.search(&query, &collector)?;

    let output = top_docs.into_iter()
        .map(|(_score, doc_address)| {
            let doc = searcher.doc(doc_address).unwrap();
            let json_str = schema.to_json(&doc);
            serde_json::from_str::<Value>(&json_str).unwrap()
        })
        .collect::<Vec<_>>();

    Ok(output)
}