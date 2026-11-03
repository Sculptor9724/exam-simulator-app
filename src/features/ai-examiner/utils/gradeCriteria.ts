type GradeCriteria = "7-skala" | "bestået-ikke-bestået" | "no-grade";

export function getGradeCriteriaText(
  gradeCriteria?: GradeCriteria | string | null,
): string {
  let gradeCriteriaReturn = "";

  if (gradeCriteria === "7-skala") {
    gradeCriteriaReturn = `12 \tDen fremragende præstation \tKarakteren 12 gives for den fremragende præstation, der demonstrerer udtømmende opfyldelse af fagets mål, med ingen eller få uvæsentlige mangler \tA
10 \tDen fortrinlige præstation \tKarakteren 10 gives for den fortrinlige præstation, der demonstrerer omfattende opfyldelse af fagets mål, med nogle mindre væsentlige mangler \tB
7 \tDen gode præstation \tKarakteren 7 gives for den gode præstation, der demonstrerer opfyldelse af fagets mål, med en del mangler \tC
4 \tDen jævne præstation \tKarakteren 4 gives for den jævne præstation, der demonstrerer en mindre grad af opfyldelse af fagets mål, med adskillige væsentlige mangler \tD
02 \tDen tilstrækkelige præstation \tKarakteren 02 gives for den tilstrækkelige præstation, der demonstrerer den minimalt acceptable grad af opfyldelse af fagets mål \tE
00 \tDen utilstrækkelige præstation \tKarakteren 00 gives for den utilstrækkelige præstation, der ikke demonstrerer en acceptabel grad af opfyldelse af fagets mål \tFx
-3 \tDen ringe præstation \tKarakteren -3 gives for den helt uacceptable præstation \tF`;
  } else if (gradeCriteria === "bestået-ikke-bestået") {
    gradeCriteriaReturn = "Bestået/Ikke bestået";
  } else if (gradeCriteria === "no-grade") {
    gradeCriteriaReturn = "Den studerende skal ikke have en karakter.";
  }

  return gradeCriteriaReturn;
}

export function getGradeInstructionText(
  gradeCriteria?: GradeCriteria | string | null,
  feedbackInstructions?: string | null,
): string {
  const gradeCriteriaText = getGradeCriteriaText(gradeCriteria);
  const feedbackInstructionText = feedbackInstructions?.trim()
    ? `

--------------- FEEDBACKINSTRUKTIONER ---------------
${feedbackInstructions.trim()}
--------------- FEEDBACKINSTRUKTIONER SLUT ---------------`
    : "";

  if (gradeCriteria === "no-grade") {
    return `Du skal nu give den studerende feedback baseret på, hvordan eksamen forløb. Kun vurder det den studerende har gjort. 
Du må ikke give en karakter, pointscore, bestået/ikke bestået-vurdering eller en karakterlignende vurdering.

--------------- KARAKTERKRITERIER ---------------
${gradeCriteriaText}
--------------- KARAKTERKRITERIER SLUT ---------------${feedbackInstructionText}`;
  }

  if (gradeCriteria === "bestået-ikke-bestået") {
    return `Du skal nu give den studerende en vurdering og feedback baseret på, hvordan eksamen forløb.
Vurderingen skal være enten "Bestået" eller "Ikke bestået".
Feedbacken skal begrunde vurderingen ud fra læringsmålene og nævne både styrker og de vigtigste forbedringspunkter.

--------------- KARAKTERKRITERIER ---------------
${gradeCriteriaText}
--------------- KARAKTERKRITERIER SLUT ---------------${feedbackInstructionText}`;
  }

  return `Du skal nu give den studerende en karakter og feedback baseret på, hvordan eksamen forløb.
Karakteren skal være en gyldig karakter på 7-trinsskalaen: -3, 00, 02, 4, 7, 10 eller 12.
Feedbacken skal begrunde karakteren ud fra læringsmålene og nævne både styrker og de vigtigste forbedringspunkter.

--------------- KARAKTERKRITERIER ---------------
${gradeCriteriaText}
--------------- KARAKTERKRITERIER SLUT ---------------${feedbackInstructionText}`;
}
