
import React, { useEffect } from 'react';

interface AdSensePanelProps {
    adType: string;
    className?: string;
}

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

export const AdSensePanel: React.FC<AdSensePanelProps> = ({ adType, className }) => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e: any) {
            // This error is known to occur in development with React StrictMode
            // due to the double-invoking of effects. It's safe to ignore this specific error
            // as it won't occur in production.
            if (e && e.message && e.message.includes("All 'ins' elements in the DOM with class=adsbygoogle already have ads in them.")) {
                console.warn('AdSense warning (dev-only): ', e.message);
                return;
            }
            console.error("AdSense error:", e);
        }
    }, []);

    return (
        <div className={`flex justify-center items-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 ${className}`}>
            <div className="text-center p-4">
                <p className="font-bold text-gray-400">{adType} Ad Slot</p>
                {/*
                    Instructions:
                    1. Get your ad code from your Google AdSense account.
                    2. Replace this entire comment block with the <ins> tag provided by AdSense.
                       Remember to convert attributes to JSX syntax, e.g., class="adsbygoogle" becomes className="adsbygoogle"
                       and style="display:block" becomes style={{display: 'block'}}.
                    3. Ensure your publisher ID is correctly set in the <script> tag in index.html.

                    Example AdSense Code (for JSX):
                    <ins className="adsbygoogle"
                         style={{display: 'block'}}
                         data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                         data-ad-slot="YYYYYYYYYY"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                */}
            </div>
        </div>
    );
};
