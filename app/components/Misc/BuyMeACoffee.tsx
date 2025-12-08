import React, { useEffect } from 'react';

export default function BuyMeACoffee() {
    useEffect(() => {
		let script = document.createElement("script");
		script.setAttribute('data-name','BMC-Widget');
		script.src = "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js";
		script.setAttribute('data-id', 'skroell');
		script.setAttribute('data-description', 'Thank you for your support!');
		script.setAttribute('data-message', 'This website is free to use. Consider buying me a coffee :)');
		script.setAttribute('data-color',"#7c7c7c");
		script.setAttribute('data-position','right');
		script.setAttribute('data-x_margin','18');
		script.setAttribute('data-y_margin','18');
		script.async = true;
		script.onload = function(){
			var evt = document.createEvent('Event');
			evt.initEvent('DOMContentLoaded', false, false);
			window.dispatchEvent(evt);
		};
		document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
            const widget = document.getElementById("bmc-wbtn");
            if (widget) document.body.removeChild(widget);
        }
    }, []);

    return null;
}