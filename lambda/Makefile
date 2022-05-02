all: app transcribe transcribe-complete subtitle kendra-index tantivy-index dist

app:
	cargo lambda build --release --bin app --target aarch64-unknown-linux-gnu

transcribe:
	cargo lambda build --release --bin transcribe --target aarch64-unknown-linux-gnu

transcribe-complete:
	cargo lambda build --release --bin transcribe-complete --target aarch64-unknown-linux-gnu

subtitle:
	cargo lambda build --release --bin subtitle --target aarch64-unknown-linux-gnu

kendra-index:
	cargo lambda build --release --bin kendra-index --target aarch64-unknown-linux-gnu

tantivy-index:
	cargo lambda build --release --bin tantivy-index --target aarch64-unknown-linux-gnu

tantivy-search:
	cargo lambda build --release --bin tantivy-search --target aarch64-unknown-linux-gnu

dist:
	mkdir -p ../.dist
	cp -r target/lambda/ ../.dist/

codebuild:
	cargo build --release
	mkdir -p ../.dist/app
	cp target/release/app ../.dist/app/bootstrap
	mkdir -p ../.dist/transcribe
	cp target/release/transcribe ../.dist/transcribe/bootstrap
	mkdir -p ../.dist/transcribe-complete
	cp target/release/transcribe-complete ../.dist/transcribe-complete/bootstrap
	mkdir -p ../.dist/subtitle
	cp target/release/subtitle ../.dist/subtitle/bootstrap
	mkdir -p ../.dist/kendra-index
	cp target/release/kendra-index ../.dist/kendra-index/bootstrap
	mkdir -p ../.dist/tantivy-index
	cp target/release/tantivy-index ../.dist/tantivy-index/bootstrap
	mkdir -p ../.dist/tantivy-search
	cp target/release/tantivy-search ../.dist/tantivy-search/bootstrap