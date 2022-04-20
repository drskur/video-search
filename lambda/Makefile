all: transcribe transcribe-complete subtitle dist

transcribe:
	cargo lambda build --release --bin transcribe --target aarch64-unknown-linux-gnu

transcribe-complete:
	cargo lambda build --release --bin transcribe-complete --target aarch64-unknown-linux-gnu

subtitle:
	cargo lambda build --release --bin subtitle --target aarch64-unknown-linux-gnu

dist:
	mkdir -p ../.dist
	cp -r target/lambda/ ../.dist/