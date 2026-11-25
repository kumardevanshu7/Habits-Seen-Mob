package com.arigatolabs.habitsseen;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;
import java.io.File;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Remove any legacy PWA Service Worker storage so CapacitorUpdater OTA reloads never serve stale HTML/JS
        clearLegacyServiceWorkerStorage();
        registerPlugin(GoogleAuth.class);
        super.onCreate(savedInstanceState);
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().clearCache(true);
        }
    }

    private void clearLegacyServiceWorkerStorage() {
        try {
            File dataDir = new File(getApplicationInfo().dataDir);
            String[] swPaths = new String[] {
                "app_webview/Default/Service Worker",
                "app_webview/Service Worker"
            };
            for (String rel : swPaths) {
                File dir = new File(dataDir, rel);
                if (dir.exists()) {
                    deleteRecursively(dir);
                }
            }
        } catch (Exception ignored) {
        }
    }

    private void deleteRecursively(File fileOrDirectory) {
        if (fileOrDirectory.isDirectory()) {
            File[] children = fileOrDirectory.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursively(child);
                }
            }
        }
        fileOrDirectory.delete();
    }
}

