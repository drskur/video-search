use aws_lambda_events::event::s3::S3Event;
use lambda_runtime::{Error, service_fn, LambdaEvent};
use serde_json::Value;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let func = service_fn(handler);
    lambda_runtime::run(func).await?;

    Ok(())
}

async fn handler(ev: LambdaEvent<Value>) -> Result<(), Error> {
    println!("Hello, World");
    println!("{:?}", ev.payload);
    Ok(())
}