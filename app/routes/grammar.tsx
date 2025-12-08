import React from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

export default function Grammar() {
	return (
		<Container maxWidth="lg">
			<Box sx={{ py: { xs: 2, sm: 3 } }}>
				<div className="grammar">
					<Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
						The Grammar of Trigedasleng
					</Typography>
					
					<Box className="entry" id="about-trigedasleng" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#about-trigedasleng">About Trigedasleng</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Trigedasleng is a constructed language (conlang) developed by David J. Peterson for use
							on the CW show <i>The 100</i>. The Woods Clan (<i>Trigedakru</i>/<i>Trikru</i>) and Sand Nomads
							(<i>Sanskavakru</i>) have been heard using this language, but other groups of grounders (that
							is, earth-born people not born inside Mt. Weather) may also speak the language. Some of the Sky
							People (<i>Skaikru</i>; those from the Ark) began to learn Trigedasleng after repeated contact
							with the <i>Trigedakru</i>.
						</Typography>
						<Typography variant="body1" paragraph>
							Trigedasleng is descended from a heavily-accented dialect of American English. It has evolved
							rapidly over three generations. Its development was also influenced by an early code-system
							that was developed shortly after the Cataclysm, but this only affected the lexicon in any
							substantial way. At the time of the Ark's descent, it is believed that most grounders speak
							only Trigedasleng; warriors (and certain others, like Nyko the healer) speak both
							Trigedasleng and American English, a fact which they are careful to hide from their
							enemies.
						</Typography>
						<Typography variant="body1" paragraph>
							Trigedasleng is <i>not</i> a creole, but a descendant of American English alone, and while it
							may share similarities with AAVE (African American Vernacular English, which is also derived
							from American English), those similarities are not intentional, and Trigedasleng does not
							derive from AAVE.
						</Typography>
					</Box>
					
					<Box className="entry" id="pronunciation-writing" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#pronunciation-writing">Pronunciation &amp; Writing</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Trigedasleng doesn't have its own writing system. The bits of writing that have survived the
							last 97 years are incomplete and have probably been passed down from warrior to warrior
							along with English. The writers of <i>The 100</i> asked Peterson to use a simplified
							spelling system for the scripts, instead of using more English-like spelling rules. The
							table below illustrates this simplified system.
						</Typography>
						
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell><strong>Vowel</strong></TableCell>
										<TableCell><strong>Sounds Like</strong></TableCell>
										<TableCell colSpan={2}><strong>English Name</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>A, a*</TableCell>
										<TableCell><u><b>a</b></u>pple</TableCell>
										<TableCell colSpan={2}>short A</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Ai, ai</TableCell>
										<TableCell><b><u>i</u></b>ce</TableCell>
										<TableCell colSpan={2}>long I</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>E, e</TableCell>
										<TableCell>g<b><u>e</u></b>t</TableCell>
										<TableCell colSpan={2}>short E</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Ei, ei</TableCell>
										<TableCell>f<b><u>a</u></b>ce</TableCell>
										<TableCell colSpan={2}>long A</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>I, i</TableCell>
										<TableCell>m<b><u>ee</u></b>t OR k<b><u>i</u></b>d</TableCell>
										<TableCell colSpan={2}>long E / short I</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>O, o</TableCell>
										<TableCell>l<b><u>aw</u></b> OR s<b><u>o</u></b>n</TableCell>
										<TableCell colSpan={2}>short O / short U</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Ou, ou</TableCell>
										<TableCell>wr<b><u>o</u></b>te</TableCell>
										<TableCell colSpan={2}>long O</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>U, u</TableCell>
										<TableCell>r<b><u>u</u></b>de</TableCell>
										<TableCell colSpan={2}>long U</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>* A, a (end of word)</TableCell>
										<TableCell>sof<b><u>a</u></b></TableCell>
										<TableCell colSpan={2}>schwa</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Au, au (diphthongized)</TableCell>
										<TableCell>l<b><u>ou</u></b>d</TableCell>
										<TableCell colSpan={2}>"ow"</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
						
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell><strong>Consonant</strong></TableCell>
										<TableCell><strong>Sounds Like</strong></TableCell>
										<TableCell><strong>Consonant</strong></TableCell>
										<TableCell><strong>Sounds Like</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>B, b</TableCell>
										<TableCell>ball</TableCell>
										<TableCell>P, p</TableCell>
										<TableCell>pull</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Ch, ch</TableCell>
										<TableCell>chair</TableCell>
										<TableCell>R, r</TableCell>
										<TableCell>radio</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>D, d</TableCell>
										<TableCell>daft</TableCell>
										<TableCell>S, s</TableCell>
										<TableCell>seven</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>F, f</TableCell>
										<TableCell>fire</TableCell>
										<TableCell>Sh, sh</TableCell>
										<TableCell>shine</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>G, g</TableCell>
										<TableCell>good (<i>not</i> giraffe)</TableCell>
										<TableCell>T, t</TableCell>
										<TableCell>talk</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>H, h</TableCell>
										<TableCell>hello</TableCell>
										<TableCell>Th, th</TableCell>
										<TableCell>think (<i>not</i> these)</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>J, j</TableCell>
										<TableCell>juice</TableCell>
										<TableCell>V, v</TableCell>
										<TableCell>viking</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>K, k</TableCell>
										<TableCell>kick</TableCell>
										<TableCell>W, w</TableCell>
										<TableCell>water</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>L, l</TableCell>
										<TableCell>lime</TableCell>
										<TableCell>Y, y</TableCell>
										<TableCell>yellow</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>M, m</TableCell>
										<TableCell>made</TableCell>
										<TableCell>Z, z</TableCell>
										<TableCell>zipper</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>N, n</TableCell>
										<TableCell>need</TableCell>
										<TableCell></TableCell>
										<TableCell></TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
						
						<Typography variant="body1" paragraph>
							Trigedasleng does not use the letters C, Q, or X.
						</Typography>
					</Box>
					
					<Box className="entry" id="names" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#names">Names</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Names in Trigedasleng are rendered phonetically, or 'sounded out', based on the system above.
							Here are a few examples from the show:
						</Typography>
						<Paper sx={{ overflow: 'auto' }}>
							<Table size="small" className="grammar">
								<TableBody>
									<TableRow>
										<TableCell><strong>Bellamy</strong></TableCell>
										<TableCell><strong>Octavia</strong></TableCell>
										<TableCell><strong>Clarke</strong></TableCell>
										<TableCell><strong>Lincoln</strong></TableCell>
										<TableCell><strong>Lexa</strong></TableCell>
										<TableCell><strong>Gustus</strong></TableCell>
										<TableCell><strong>Nyko</strong></TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Belomi</TableCell>
										<TableCell>Okteivia</TableCell>
										<TableCell>Klark*</TableCell>
										<TableCell>Linkon</TableCell>
										<TableCell>Leksa</TableCell>
										<TableCell>Gostos</TableCell>
										<TableCell>Naikou</TableCell>
									</TableRow>
									<TableRow>
										<TableCell colSpan={7}>
											* Peterson originally transcribed Clarke's name as <i>Klok</i>, but
											later corrected the spelling to <i>Klark</i>.
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
					</Box>
					
					<Box className="entry" id="stress" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#stress">Stress</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Stress is lexical, but semi-predictable if you're familiar with the English word(s) that
							gave rise to the Trigedasleng word(s). Often stress is irrelevant, as many words are
							monosyllabic.
						</Typography>
					</Box>
					
					<Box className="entry" id="monosyllabic-vowel-final" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#monosyllabic-vowel-final">Monosyllabic Vowel Final Content Words</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Monosyllabic content words (i.e. nouns, adjectives and verbs) will end in a vowel.
							These words will have their vowels lengthened. This happens naturally in English
							with similar words (for example, the vowel in <i>tree</i> is longer than the vowel in <i>treat</i>).
							This length will not be marked on the word, but will be indicated in the phonetic
							transcription.
						</Typography>
					</Box>
					
					<Box className="entry" id="morphology-syntax" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#morphology-syntax">Morphology and Syntax</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Trigedasleng is an SVO language that is largely isolating. Modifiers tend to precede
							their heads, but there are postposed verbal/nominal particles. The language is
							prepositional, and where possession is implied without the use of a preposition, the
							possessor precedes the possessee. Relative clauses follow the nouns they modify.
						</Typography>
					</Box>
					
					<Box className="entry" id="nouns" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#nouns">Nouns</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Trigedasleng nouns and pronouns no longer inflect for number or case. To the extent
							that number marking is required, plurality can be indicated in a few non-obligatory
							ways:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Preposed Particle I:</strong> <i>bosh hef</i> "men"</li>
								<li><strong>Preposed Particle II:</strong> <i>loda hef</i> "men"</li>
								<li><strong>Preposed Particle III:</strong> <i>emo hef</i> "men"</li>
								<li><strong>Numeral:</strong> <i>sis hef</i> "six men"</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph sx={{ mt: 2 }}>
							Verbs also mark their objects with a postposed particle called a verbal satellite. These
							verbal satellites are subcategorized by the verb, and will be listed with each verb in
							the lexicon. The verbal satellite always occurs after the object. Some examples are
							given below:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><i>Ai rip em au.</i> "I repair it."</li>
								<li><i>Ai beja em daun.</i> "I beg him."</li>
								<li><i>Ai gaf em in.</i> "I want it."</li>
								<li><i>Ai flosh em klin.</i> "I destroy it."</li>
								<li><i>Ai top em of.</i> "I fill it."</li>
								<li><i>Ai as em op.</i> "I ask him."</li>
								<li><i>Ai kik em thru.</i> "I survive it."</li>
								<li><i>Ai pul em we.</i> "I draw it away."</li>
							</ul>
						</Typography>
					</Box>
					
					<Box className="entry" id="verbs" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#verbs">Verbs</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Trigedasleng verbs have lost all tense and agreement forms. They've been replaced
							by an invariant form of each verb that's supported by participles to indicate tense
							and aspect. Below are given some examples of the various tense aspect particles and
							how they combine:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Present Active (Default):</strong> <i>Em fig raun.</i> "He thinks."</li>
								<li><strong>Past Active:</strong> <i>Em don fig raun.</i> "He thought."</li>
								<li><strong>Future Active:</strong> <i>Em na fig raun.</i> "He will think."</li>
							</ul>
						</Typography>
						<Typography variant="h5" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
							Imperative
						</Typography>
						<Typography variant="body1" paragraph>
							The imperative form of the verb is used to issue commands. Comparatives are the simple bare form of the verb with its concomitant postposed particles:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><i>Hon em daun!</i> "Capture him!"</li>
								<li><i>Fig raun!</i> "Think!"</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							Negative imperatives are formed in the same way negative verbs are formed:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><i>Nou hon em daun!</i> "Don't capture him!"</li>
								<li><i>Nou fig raun!</i> "Don't think!"</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							Commands can be given to non-second person entities by using the auxiliary <i>teik</i>:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><i>Teik em hon em daun!</i> "Let him capture him!"</li>
								<li><i>Teik em fig raun!</i> "Let him think!"</li>
								<li><i>Nou teik em hon em daun!</i> "Don't let him capture him!"</li>
								<li><i>Nou teik em fig raun!</i> "Don't let him think!"</li>
							</ul>
						</Typography>
						<Typography variant="h5" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
							Valency
						</Typography>
						<Typography variant="body1" paragraph>
							Trigedasleng makes use of a few valency-altering techniques to form different types of clauses and emphasize different parts of the sentence. At this stage both passive and causative structures exist.
						</Typography>
						<Typography variant="body1" paragraph>
							<strong>Passive constructions:</strong>
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Present Passive:</strong> <i>Em ge fig op.</i> "It is thought."</li>
								<li><strong>Past Passive:</strong> <i>Em don ge fig op.</i> "It was thought."</li>
								<li><strong>Future Passive:</strong> <i>Em na ge fig op.</i> "It will be thought."</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							The agent of a passive verb may be introduced with the preposition <i>kom</i>:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><i>Em ge fig op kom ai.</i> "It is thought by me."</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							<strong>Causative constructions</strong> are actually formed in the same way that non-second person commands are formed, using the auxiliary <i>teik</i>:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Present Causative:</strong> <i>Ai teik em fig raun.</i> "I make him think."</li>
								<li><strong>Past Causative:</strong> <i>Ai don teik em fig raun.</i> "I made him think."</li>
								<li><strong>Future Causative:</strong> <i>Ai na teik em fig raun.</i> "I will make him think."</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							Both constructions can be combined in additive ways:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Present Causative Passive:</strong> <i>Ai teik em ge fig op.</i> "I make it be thought."</li>
								<li><strong>Present Passive Causative:</strong> <i>Ai ge teik na fig raun.</i> "I am made to think."</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							Finally, intransitive verbs usually come with a postposed particle indicating that the
							verb takes no object. For most active verbs, that particle is <i>raun</i>. It's only used with
							active verbs; never with verbs that have been passivized (those use their transitive
							particles). Verbs that use a different particle will have it listed. Some motile verbs use
							adverbs instead. Those verbs will be noted in the lexicon.
						</Typography>
						<Typography variant="h5" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
							Negation
						</Typography>
						<Typography variant="body1" paragraph>
							To negate a verb, simply place <i>nou</i> in front of the clause. Several examples are shown below:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Present Active:</strong> <i>Ai nou fig raun.</i> "I don't think."</li>
								<li><strong>Future Active:</strong> <i>Ai nou na fig raun.</i> "I won't think."</li>
								<li><strong>Present Passive:</strong> <i>Em nou ge fig op kom ai.</i> "It is not thought by me."</li>
							</ul>
						</Typography>
						<Typography variant="h5" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
							Participles
						</Typography>
						<Typography variant="body1" paragraph>
							Participles are formed in a number of ways. The active participles are listed below:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Purposive Active Participle:</strong> <i>hef na fig raun</i> "thinking man"</li>
								<li><strong>Eventative Active Participle:</strong> <i>hef ste fig raun</i> "thinking man"</li>
								<li><strong>Descriptive Active Participle:</strong> <i>hef (bilaik) fig raun</i> "thinking man"</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							The differences between these three participles are extremely subtle. A purposive
							participle is used to describe a noun that will take on or be associated with the
							characteristics of the participle in the future. An eventative participle is used to
							describe what a noun is currently in the process of doing or is currently like. A
							descriptive participle is a phrase used to describe the way a noun always is. In the
							case of the descriptive participle, the subordinator <i>bilaik</i> is optional, and is more
							likely to be used in on-the-fly constructions.
						</Typography>
						<Typography variant="body1" paragraph>
							Passive participles feature the same split:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Purposive Passive Participle:</strong> <i>hef na ge fig raun</i> "man to be thought of"</li>
								<li><strong>Eventative Passive Participle:</strong> <i>hef ste ge fig raun</i> "being thought of man"</li>
								<li><strong>Descriptive Passive Participle:</strong> <i>hef (bilaik) ge fig raun</i> "thought of man"</li>
							</ul>
						</Typography>
					</Box>
					
					<Box className="entry" id="adjectives" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#adjectives">Adjectives</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Trigedasleng adjectives do not agree in either case or number with the nouns they
							modify. Adjectives do participate in a comparative paradigm, but that paradigm
							differs from English.
						</Typography>
						<Typography variant="h5" component="h3" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
							Comparison
						</Typography>
						<Typography variant="body1" paragraph>
							Adjectives in English can take the suffix "-er" to indicate that its quality
							is greater than another entity, and "-est" to indicate that its quality is superior to all
							others'. In Trigedasleng, there is only the comparative level; the superlative level has
							been lost. Comparison is indicated with the preposed particle <i>mou</i>:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Positive (Default):</strong> <i>klir graun</i> "safe ground"</li>
								<li><strong>Comparative:</strong> <i>mou klir graun</i> "safer ground"</li>
								<li><strong>Superlative:</strong> <i>mou klir graun</i> "safest ground"</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							The sound changes related to the comparative paradigm have rendered the
							superlative/comparative distinction moot, as can be seen above. To emphasize the
							superlative nature of a construction, the postposed particle <i>sou</i> can be used:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Emphatic Superlative:</strong> <i>mou klir graun sou</i> "safest ground"</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							To express the comparand, use the preposition <i>kom</i>:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Comparative with Comparand:</strong> <i>mou klir graun kom hir</i> "safer ground than here"</li>
							</ul>
						</Typography>
					</Box>
					
					<Box className="entry" id="demonstratives" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#demonstratives">Demonstratives</a>
						</Typography>
						<Typography variant="body1" paragraph>
							There are three types of demonstratives in Trigedasleng based on their distance from
							the speaker. Their adjectival forms are shown below:
						</Typography>
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell><strong>Form</strong></TableCell>
										<TableCell><strong>Example</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>Proximal: <i>disha</i></TableCell>
										<TableCell><i>disha tro</i> "this patrol"</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Medial: <i>dei</i></TableCell>
										<TableCell><i>dei tro</i> "that patrol"</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Distal: <i>dei…de</i></TableCell>
										<TableCell><i>dei tro de</i> "that patrol over yonder (far away)"</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
						<Typography variant="body1" paragraph>
							These demonstrative adjectives can be turned into demonstrative pronouns as follows:
						</Typography>
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell><strong>Form</strong></TableCell>
										<TableCell><strong>Example</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>Proximal: <i>dison</i></TableCell>
										<TableCell><i>Dison ste klir.</i> "This one is empty."</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Medial: <i>daun</i></TableCell>
										<TableCell><i>Daun ste klir.</i> "That one is empty."</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Distal: <i>daunde</i></TableCell>
										<TableCell><i>Daunde ste klir.</i> "That one there is empty."</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
						<Typography variant="body1" paragraph>
							The locative pronouns have stayed closer to their English forms:
						</Typography>
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell><strong>Form</strong></TableCell>
										<TableCell><strong>Example</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>Proximal: <i>hir</i></TableCell>
										<TableCell><i>Em kamp raun hir.</i> "He is here."</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Medial: <i>der</i></TableCell>
										<TableCell><i>Em kamp raun der.</i> "He is there."</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Distal: <i>ouder</i></TableCell>
										<TableCell><i>Em kamp raun ouder.</i> "He is over yonder."</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
					</Box>
					
					<Box className="entry" id="adverbs" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#adverbs">Adverbs</a>
						</Typography>
						<Typography variant="body1" paragraph>
							There is no longer a distinction between adjectives and adverbs. Instead, adjectives
							used in adverbial positions are taken to be adverbs.
						</Typography>
					</Box>
					
					<Box className="entry" id="relative-clauses" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#relative-clauses">Relative Clauses</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Relative clauses in Trigedasleng are basically non-existent. What serve as relative
							clauses are simply clause chains that make use of resumptive pronouns. Some
							examples are shown below:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Subject:</strong> <i>Hef don riz em daun em laik lukot.</i> "The man who seduced him is a friend."</li>
								<li><strong>Direct Object I:</strong> <i>Hef don ge riz daun em laik lukot.</i> "The man who got seduced is a friend."</li>
								<li><strong>Direct Object II:</strong> <i>Hef plan don riz daun em laik lukot.</i> "The man the woman seduced is a friend."</li>
								<li><strong>Location:</strong> <i>Trap ai don riz em daun raun der em ge flosh klin.</i> "The base where I seduced him was destroyed."</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							In general, Trigedasleng is far more analytic than English is at this stage, despite
							English itself being fairly analytic now.
						</Typography>
					</Box>
					
					<Box className="entry" id="questions" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#questions">Questions</a>
						</Typography>
						<Typography variant="h5" component="h3" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
							Yes/No Questions
						</Typography>
						<Typography variant="body1" paragraph>
							Yes/no questions are questions that are often answered with either "yes" or "no". Yes/no questions are identical in form to their corresponding statements, with the only distinction being intonational:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><i>Yu don riz em daun.</i> "You seduced him."</li>
								<li><i>Yu don riz em daun?</i> "Did you seduce him?"</li>
							</ul>
						</Typography>
						<Typography variant="body1" paragraph>
							Negative yes/no questions are quite common, and are formed simply as shown below:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><i>Din yu don riz em daun?</i> "Didn't you seduce him?"</li>
								<li><i>Din yu na riz em daun?</i> "Won't you seduce him?"</li>
							</ul>
						</Typography>
						<Typography variant="h5" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
							WH-Questions
						</Typography>
						<Typography variant="body1" paragraph>
							WH-questions are so called because in English, most WH-questions feature a word that has "w" and "h" in it (i.e. who, why, what, where, when or how [or even which]). To form a WH-question, a WH-word is used to stand in place of the element being questioned:
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Who:</strong> <i>Chon don riz em daun?</i> "Who seduced him?"</li>
								<li><strong>What:</strong> <i>Chit don riz em daun?</i> "What seduced him?"</li>
								<li><strong>Where:</strong> <i>Weron yu don riz em daun?</i> "Where did you seduce him?"</li>
								<li><strong>When:</strong> <i>Taim yu don riz em daun?</i> "When did you seduce him?"</li>
								<li><strong>How:</strong> <i>Ha yu don riz em daun?</i> "How did you seduce him?"</li>
								<li><strong>Which I:</strong> <i>Chon emo hef don riz em daun?</i> "Which man seduced him?"</li>
								<li><strong>Which II:</strong> <i>Chon yo hef don riz em daun?</i> "Which one of you men seduced him?"</li>
								<li><strong>Whose:</strong> <i>Chon emo hef don riz em daun?</i> "Whose man seduced him?"</li>
								<li><strong>How Many:</strong> <i>Hani hef don riz em daun?</i> "How many men seduced him?"</li>
								<li><strong>Why I:</strong> <i>Hakom hef don riz em daun?</i> "Why did the man seduce him?"</li>
								<li><strong>Why II:</strong> <i>Chomouda hef don riz em daun?</i> "Why did the man seduce him?"</li>
							</ul>
						</Typography>
					</Box>
					
					<Box className="entry" id="pronouns" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#pronouns">Pronouns</a>
						</Typography>
						<Typography variant="h5" component="h3" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
							Personal Pronouns
						</Typography>
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell></TableCell>
										<TableCell><strong>Singular</strong></TableCell>
										<TableCell colSpan={2}><strong>Plural</strong></TableCell>
									</TableRow>
									<TableRow>
										<TableCell></TableCell>
										<TableCell></TableCell>
										<TableCell><strong>Inclusive</strong></TableCell>
										<TableCell><strong>Exclusive</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell><strong>First Person</strong></TableCell>
										<TableCell>ai/a</TableCell>
										<TableCell>oso</TableCell>
										<TableCell>osir</TableCell>
									</TableRow>
									<TableRow>
										<TableCell><strong>Second Person</strong></TableCell>
										<TableCell>yu</TableCell>
										<TableCell colSpan={2}>yo</TableCell>
									</TableRow>
									<TableRow>
										<TableCell><strong>Third Person (Standard)</strong></TableCell>
										<TableCell>em</TableCell>
										<TableCell colSpan={2}>emo</TableCell>
									</TableRow>
									<TableRow>
										<TableCell><strong>Third Person (Hostile)</strong></TableCell>
										<TableCell>du</TableCell>
										<TableCell colSpan={2}></TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
					</Box>
					
					<Box className="entry" id="number-system" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#number-system">Number System</a>
						</Typography>
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell><strong>#</strong></TableCell>
										<TableCell><strong>Cardinal</strong></TableCell>
										<TableCell><strong>Ordinal</strong></TableCell>
										<TableCell><strong>#</strong></TableCell>
										<TableCell><strong>Cardinal</strong></TableCell>
										<TableCell><strong>Ordinal</strong></TableCell>
										<TableCell><strong>#</strong></TableCell>
										<TableCell><strong>Cardinal</strong></TableCell>
										<TableCell><strong>Ordinal</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>1</TableCell>
										<TableCell>won</TableCell>
										<TableCell>fos</TableCell>
										<TableCell>11</TableCell>
										<TableCell>len</TableCell>
										<TableCell>lenon</TableCell>
										<TableCell>70</TableCell>
										<TableCell>sendi</TableCell>
										<TableCell>sendit</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>2</TableCell>
										<TableCell>tu</TableCell>
										<TableCell>seken</TableCell>
										<TableCell>12</TableCell>
										<TableCell>twel</TableCell>
										<TableCell>twelon</TableCell>
										<TableCell>80</TableCell>
										<TableCell>eidi</TableCell>
										<TableCell>eidit</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>3</TableCell>
										<TableCell>thri</TableCell>
										<TableCell>thot</TableCell>
										<TableCell>13</TableCell>
										<TableCell>thotin</TableCell>
										<TableCell>thotinon</TableCell>
										<TableCell>90</TableCell>
										<TableCell>naidi</TableCell>
										<TableCell>naidit</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>4</TableCell>
										<TableCell>fou</TableCell>
										<TableCell>fot</TableCell>
										<TableCell>14</TableCell>
										<TableCell>fotin</TableCell>
										<TableCell>fotinon</TableCell>
										<TableCell>100</TableCell>
										<TableCell>honet</TableCell>
										<TableCell>honet</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>5</TableCell>
										<TableCell>fai</TableCell>
										<TableCell>fit</TableCell>
										<TableCell>20</TableCell>
										<TableCell>tweni</TableCell>
										<TableCell>twenit</TableCell>
										<TableCell>200</TableCell>
										<TableCell>tu honet</TableCell>
										<TableCell>tu honet</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>6</TableCell>
										<TableCell>sis</TableCell>
										<TableCell>sison</TableCell>
										<TableCell>21</TableCell>
										<TableCell>tweni won</TableCell>
										<TableCell>tweni fos</TableCell>
										<TableCell>201</TableCell>
										<TableCell>tu honet won</TableCell>
										<TableCell>tu honet fos</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>7</TableCell>
										<TableCell>sen</TableCell>
										<TableCell>senon</TableCell>
										<TableCell>30</TableCell>
										<TableCell>thodi</TableCell>
										<TableCell>thodit</TableCell>
										<TableCell>1,000</TableCell>
										<TableCell>thauz</TableCell>
										<TableCell>thauzet</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>8</TableCell>
										<TableCell>eit</TableCell>
										<TableCell>eidon</TableCell>
										<TableCell>40</TableCell>
										<TableCell>fodi</TableCell>
										<TableCell>fodit</TableCell>
										<TableCell>10<sup>4</sup></TableCell>
										<TableCell>ten thauz</TableCell>
										<TableCell>ten thauzet</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>9</TableCell>
										<TableCell>nain</TableCell>
										<TableCell>nainon</TableCell>
										<TableCell>50</TableCell>
										<TableCell>fidi</TableCell>
										<TableCell>fidit</TableCell>
										<TableCell>10<sup>6</sup></TableCell>
										<TableCell>honet thauz</TableCell>
										<TableCell>honet thauzet</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>10</TableCell>
										<TableCell>ten</TableCell>
										<TableCell>tenon</TableCell>
										<TableCell>60</TableCell>
										<TableCell>sisti</TableCell>
										<TableCell>sistit</TableCell>
										<TableCell>More</TableCell>
										<TableCell>miyon</TableCell>
										<TableCell>miyonon</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
					</Box>
					
					<Box className="entry" id="calendrical-vocabulary" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#calendrical-vocabulary">Calendrical Vocabulary</a>
						</Typography>
						<Typography variant="h5" component="h3" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
							Days of the Week
						</Typography>
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell><strong>Su</strong></TableCell>
										<TableCell><strong>M</strong></TableCell>
										<TableCell><strong>T</strong></TableCell>
										<TableCell><strong>W</strong></TableCell>
										<TableCell><strong>Th</strong></TableCell>
										<TableCell><strong>F</strong></TableCell>
										<TableCell><strong>Sa</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>bounson</TableCell>
										<TableCell>blakenson</TableCell>
										<TableCell>krashon</TableCell>
										<TableCell>nulison</TableCell>
										<TableCell>bruson</TableCell>
										<TableCell>blidenson</TableCell>
										<TableCell>reison</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
						<Typography variant="h5" component="h3" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
							Months of the Year
						</Typography>
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell><strong>January</strong></TableCell>
										<TableCell><strong>February</strong></TableCell>
										<TableCell><strong>March</strong></TableCell>
										<TableCell><strong>April</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>kapmun</TableCell>
										<TableCell>kweimun</TableCell>
										<TableCell>pazmun</TableCell>
										<TableCell>rizmun</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell><strong>May</strong></TableCell>
										<TableCell><strong>June</strong></TableCell>
										<TableCell><strong>July</strong></TableCell>
										<TableCell><strong>August</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>tozmun</TableCell>
										<TableCell>jemmun</TableCell>
										<TableCell>kanzmun</TableCell>
										<TableCell>liyamun</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
						<Paper sx={{ mb: 3, overflow: 'auto' }}>
							<Table size="small" className="grammar" sx={{ minWidth: 400 }}>
								<TableHead>
									<TableRow>
										<TableCell><strong>September</strong></TableCell>
										<TableCell><strong>October</strong></TableCell>
										<TableCell><strong>November</strong></TableCell>
										<TableCell><strong>December</strong></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									<TableRow>
										<TableCell>vogmun</TableCell>
										<TableCell>libramun</TableCell>
										<TableCell>skoupimun</TableCell>
										<TableCell>sajmun</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</Paper>
					</Box>
					
					<Box className="entry" id="historical-notes" sx={{ mb: 4 }}>
						<Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
							<a href="#historical-notes">Historical Notes</a>
						</Typography>
						<Typography variant="body1" paragraph>
							Below is a behind-the-scenes description of the historical processes that gave rise to
							the alternations seen in Trigedasleng. In the descriptions below, a segment, word or
							phrase preceded by an asterisk (*) is a proto-form. A proto-form is an older form
							that's no longer present in the modern language.
						</Typography>
						<Typography variant="body1" component="div" sx={{ pl: 2 }}>
							<ul>
								<li><strong>Post Nasal Loss of T:</strong> *t &gt; Ø / n_<br />
								The sound *t was lost after nasal consonants.</li>
								<li><strong>Pre-Liquid Simplification:</strong> *oil &gt; ol; *ol &gt; o; *er &gt; o; *ar &gt; o; *er/or &gt; a / _#<br />
								A variety of sounds simplified before the l and r sounds.</li>
								<li><strong>Loss of TH:</strong> *th [ð] &gt; d<br />
								The *th sound in words like <i>then</i> and <i>that</i> became d in all instances.</li>
								<li><strong>Loss of Word-Final TH:</strong> *th [θ] &gt; t / _<br />
								Instances of word-final *th have been replaced by t.</li>
								<li><strong>Nasal Assimilation:</strong> N &gt; [αplace] / _C[αplace]<br />
								Nasal consonants assimilated in place to following consonants.</li>
								<li><strong>Loss of High Lax Vowel Distinction:</strong> *[i]/[ɪ] &gt; i; *[u]/[ʊ] &gt; u<br />
								Though pairs like <i>pit</i>/<i>Pete</i> and <i>hood</i>/<i>who'd</i> exist in English, such pairs have
								been eliminated in Trigedasleng.</li>
								<li><strong>Loss of Possessives:</strong><br />
								As a way to distinguish itself, the original code required the use of invariant
								pronouns (since those who weren't in the know would naturally use objective
								and possessive forms). This practice stuck and became a part of the language.</li>
								<li><strong>Verbal Satellites:</strong><br />
								The most noticeable grammatical innovation of Trigedasleng is the use of
								verbal satellites. These are former prepositions that have now been
								reanalyzed as postpositions and/or adverbs that modify the meaning of a
								given verb. They are now obligatory, whereas in English they're relatively
								fluid.</li>
							</ul>
						</Typography>
					</Box>
				</div>
			</Box>
		</Container>
	);
}
