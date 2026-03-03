/// Initialize the WASM module. Call once at app startup.
#[flutter_rust_bridge::frb(init)]
pub fn init_app() {
    console_error_panic_hook::set_once();
    flutter_rust_bridge::setup_default_user_utils();
}

/// Trivial function to prove the Rust-WASM-Dart pipeline works.
#[flutter_rust_bridge::frb(sync)]
pub fn greet(name: String) -> Result<String, String> {
    if name.is_empty() {
        return Err("Name cannot be empty".to_string());
    }
    Ok(format!("Hello from Rust WASM, {}!", name))
}

/// Deliberately trigger a panic to verify console_error_panic_hook works.
/// For testing/verification only.
#[flutter_rust_bridge::frb(sync)]
pub fn test_panic() {
    panic!("This is a test panic to verify console_error_panic_hook is working");
}
