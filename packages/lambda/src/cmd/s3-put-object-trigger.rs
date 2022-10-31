use aws_lambda_events::s3::S3Event;
use lambda_runtime::{Error, LambdaEvent, service_fn};

#[tokio::main]
async fn main() -> Result<(), Error> {
    let func = service_fn(handler);
    lambda_runtime::run(func).await?;

    Ok(())
}

async fn handler(event: LambdaEvent<S3Event>) -> Result<(), Error> {
    println!("{:?}", serde_json::to_string(&event.payload).unwrap());

    Ok(())
}