/** Original decorative Yorkie vector; feedback text always carries meaning. */
export function Miguel({mood = "neutral", className = ""}: {mood?: "neutral" | "pleased" | "encouraging" | "celebrate" | "review"; className?: string}) {
 const happy = mood === "pleased" || mood === "celebrate";
 return <svg className={"miguel " + className} viewBox="0 0 240 240" fill="none" aria-hidden="true" focusable="false">
 <ellipse cx="120" cy="222" rx="77" ry="10" fill="#30343b" opacity=".08"/>
 {mood === "review" && <g stroke="#82738e" strokeWidth="2"><rect x="157" y="185" width="65" height="33" rx="5" fill="#eae0f5"/><path d="M175 195h25m-25 9h17"/></g>}
 <path d="M66 170Q54 206 73 216H167Q184 207 174 168" fill="#929aa2"/><path d="M96 166Q82 192 91 214H149Q157 187 144 166" fill="#d9b487"/>
 <ellipse cx="80" cy="213" rx="22" ry="12" fill="#dfb98c"/><ellipse cx="158" cy="213" rx="22" ry="12" fill="#dfb98c"/>
 <path d="M65 99Q29 73 42 22Q79 27 97 67M144 65Q168 26 201 22Q211 73 176 100" fill="#858d98" stroke="#747b85" strokeWidth="3" strokeLinejoin="round"/>
 <path d="M61 75Q48 56 51 38Q72 46 79 69M161 69Q178 44 191 38Q192 59 179 77" fill="#e5bfa2"/>
 <path d="M59 82L78 65L85 49L103 58L117 44L130 58L150 49L158 66L181 81L184 101L198 117L188 129L194 148L178 154L173 173L152 174L139 186L119 181L99 187L85 175L65 173L61 155L44 150L51 130L42 117L56 103Z" fill="#d9b487"/>
 <path d="M82 68L104 59L118 49L132 61L150 58L162 76L143 72L128 94L120 115L111 94L97 75Z" fill="#9da3aa"/>
 <path d="M54 117Q70 98 91 105M149 105Q174 98 188 117" stroke="#edcda3" strokeWidth="12" strokeLinecap="round"/>
 <ellipse cx="88" cy="121" rx="12" ry="14" fill="#30343b"/><ellipse cx="153" cy="121" rx="12" ry="14" fill="#30343b"/>
 <circle cx="84" cy="116" r="4" fill="#fffaf1"/><circle cx="149" cy="116" r="4" fill="#fffaf1"/>
 <ellipse cx="91" cy="147" rx="19" ry="10" fill="#eabfa6" opacity=".65"/><ellipse cx="151" cy="147" rx="19" ry="10" fill="#eabfa6" opacity=".65"/>
 <path d="M80 151Q94 132 120 140Q147 132 163 151L151 170L132 173L120 180L107 173L89 170Z" fill="#f3d7b2"/>
 <path d="M108 143Q120 136 132 143Q133 154 120 158Q108 154 108 143" fill="#30343b"/>
 <path d={happy ? "M106 160Q120 180 136 160" : "M108 161Q120 171 132 161"} stroke="#675346" strokeWidth="3" strokeLinecap="round"/>
 {happy && <path d="M114 168Q120 164 127 168Q127 182 120 182Q113 181 114 168" fill="#d99491"/>}
 <path d="M88 181Q120 195 153 181L148 194L120 205L92 194Z" fill="#44705a"/><circle cx="120" cy="197" r="5" fill="#f3d7b2"/>
 {mood === "celebrate" && <g stroke="#a17b42" strokeWidth="3" strokeLinecap="round"><path d="M21 90v14m-7-7h14M213 121v12m-6-6h12M172 9v10m-5-5h10"/></g>}
 </svg>;
}
