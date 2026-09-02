#[tauri::command]
async fn game_core_call(request: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || infinite_five_game_core::dispatch_json(&request))
        .await
        .map_err(|_| "Game core task failed".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![game_core_call])
        .run(tauri::generate_context!())
        .expect("error while running Infinite Five");
}
