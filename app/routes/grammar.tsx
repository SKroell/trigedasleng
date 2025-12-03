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
				</div>
			</Box>
		</Container>
	);
}
