all: transcribe transcribe_completed dist

transcribe:
	cargo lambda build --release --bin transcribe --target aarch64-unknown-linux-gnu

transcribe_completed:
	cargo lambda build --release --bin transcribe_completed --target aarch64-unknown-linux-gnu

dist:
	mkdir -p ./.dist
	cp -r target/lambda/* ./.dist/
	ls -al ./.dist/