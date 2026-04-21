package com.husseinbayram.bookings;

import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.AppCompatButton;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {
    private static final long SPLASH_DURATION_MS = 3_000L;
    private static final long SPLASH_FADE_DURATION_MS = 520L;

    private WebView webView;
    private View splashOverlay;
    private View splashOrbBlue;
    private View splashOrbGold;
    private View splashRingOuter;
    private View splashRingInner;
    private View logoPlate;
    private View logoShine;
    private View errorPanel;
    private TextView errorMessage;
    private String allowedHost;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean splashDismissed;

    private final Runnable dismissSplashRunnable = new Runnable() {
        @Override
        public void run() {
            dismissSplash();
        }
    };

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.web_view);
        splashOverlay = findViewById(R.id.splash_overlay);
        splashOrbBlue = findViewById(R.id.splash_orb_blue);
        splashOrbGold = findViewById(R.id.splash_orb_gold);
        splashRingOuter = findViewById(R.id.splash_ring_outer);
        splashRingInner = findViewById(R.id.splash_ring_inner);
        logoPlate = findViewById(R.id.logo_plate);
        logoShine = findViewById(R.id.logo_shine);
        errorPanel = findViewById(R.id.error_panel);
        errorMessage = findViewById(R.id.error_message);

        AppCompatButton retryButton = findViewById(R.id.retry_button);
        retryButton.setOnClickListener(v -> reloadHome());

        allowedHost = parseHost(BuildConfig.WEB_APP_URL);

        configureWebView();
        startSplashMotion();

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            reloadHome();
        }

        handler.postDelayed(dismissSplashRunnable, SPLASH_DURATION_MS);

        getOnBackPressedDispatcher().addCallback(this, new androidx.activity.OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                    return;
                }

                finish();
            }
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }

        webView.setBackgroundColor(Color.TRANSPARENT);
        webView.setAlpha(0f);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }

        webView.addJavascriptInterface(new NativeBridge(), "NativeBridge");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (shouldOpenInsideWebView(uri)) {
                    return false;
                }

                return launchExternalIntent(uri);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                hideErrorState();
                if (splashDismissed && webView.getAlpha() < 1f) {
                    webView.animate().alpha(1f).setDuration(220L).start();
                }
            }

            @Override
            public void onReceivedError(
                    WebView view,
                    @NonNull WebResourceRequest request,
                    @NonNull WebResourceError error
            ) {
                super.onReceivedError(view, request, error);
                if (!request.isForMainFrame()) {
                    return;
                }

                showErrorState(getString(R.string.error_message));
            }
        });
    }

    private void startSplashMotion() {
        animateLoop(splashOrbBlue, "translationY", -18f, 18f, 4_600L);
        animateLoop(splashOrbGold, "translationY", 16f, -16f, 5_200L);
        animateLoop(splashRingOuter, "rotation", 0f, 8f, 5_000L);
        animateLoop(splashRingInner, "rotation", 0f, -10f, 4_400L);
        animateLoop(logoPlate, "translationY", -10f, 10f, 3_600L);

        ObjectAnimator shineAnimator = ObjectAnimator.ofFloat(logoShine, View.TRANSLATION_X, -320f, 320f);
        shineAnimator.setDuration(2_100L);
        shineAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        shineAnimator.setRepeatCount(ValueAnimator.INFINITE);
        shineAnimator.setRepeatMode(ValueAnimator.RESTART);
        shineAnimator.start();

        View splashTitle = findViewById(R.id.splash_title);
        View splashSubtitle = findViewById(R.id.splash_subtitle);
        splashTitle.animate().alpha(1f).setDuration(780L).setStartDelay(150L).start();
        splashSubtitle.animate().alpha(1f).setDuration(860L).setStartDelay(320L).start();
    }

    private void animateLoop(View target, String propertyName, float from, float to, long durationMs) {
        ObjectAnimator animator = ObjectAnimator.ofFloat(target, propertyName, from, to);
        animator.setDuration(durationMs);
        animator.setInterpolator(new AccelerateDecelerateInterpolator());
        animator.setRepeatCount(ValueAnimator.INFINITE);
        animator.setRepeatMode(ValueAnimator.REVERSE);
        animator.start();
    }

    private void dismissSplash() {
        if (splashDismissed) {
            return;
        }
        splashDismissed = true;

        webView.animate()
                .alpha(1f)
                .setDuration(SPLASH_FADE_DURATION_MS)
                .setInterpolator(new DecelerateInterpolator())
                .start();

        splashOverlay.animate()
                .alpha(0f)
                .scaleX(1.03f)
                .scaleY(1.03f)
                .setDuration(SPLASH_FADE_DURATION_MS)
                .setInterpolator(new DecelerateInterpolator())
                .withEndAction(new Runnable() {
                    @Override
                    public void run() {
                        splashOverlay.setVisibility(View.GONE);
                    }
                })
                .start();
    }

    private void reloadHome() {
        hideErrorState();
        webView.loadUrl(BuildConfig.WEB_APP_URL);
    }

    private void showErrorState(String message) {
        errorMessage.setText(message);
        errorPanel.setVisibility(View.VISIBLE);
        errorPanel.setAlpha(0f);
        errorPanel.animate().alpha(1f).setDuration(240L).start();
    }

    private void hideErrorState() {
        errorPanel.setVisibility(View.GONE);
    }

    private boolean shouldOpenInsideWebView(Uri uri) {
        String scheme = uri.getScheme();
        if (scheme == null) {
            return false;
        }

        String normalizedScheme = scheme.toLowerCase(Locale.ROOT);
        if (!"http".equals(normalizedScheme) && !"https".equals(normalizedScheme)) {
            return false;
        }

        if (allowedHost == null || allowedHost.isEmpty()) {
            return true;
        }

        String requestHost = uri.getHost();
        if (requestHost == null) {
            return true;
        }

        return allowedHost.equalsIgnoreCase(requestHost);
    }

    private boolean launchExternalIntent(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
            return true;
        } catch (ActivityNotFoundException ignored) {
            return false;
        }
    }

    @Nullable
    private String parseHost(String rawUrl) {
        try {
            URI parsed = new URI(rawUrl);
            return parsed.getHost();
        } catch (URISyntaxException ignored) {
            return null;
        }
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        handler.removeCallbacks(dismissSplashRunnable);
    }

    private final class NativeBridge {
        @JavascriptInterface
        public void printCurrentPage() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(getString(R.string.invoice_print_job));
                    printManager.print(
                            getString(R.string.invoice_print_job),
                            adapter,
                            new PrintAttributes.Builder().build()
                    );
                }
            });
        }

        @JavascriptInterface
        public void shareText(final String title, final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.setType("text/plain");
                    intent.putExtra(Intent.EXTRA_SUBJECT, title);
                    intent.putExtra(Intent.EXTRA_TEXT, text);
                    startActivity(Intent.createChooser(intent, getString(R.string.share_invoice)));
                }
            });
        }
    }
}
