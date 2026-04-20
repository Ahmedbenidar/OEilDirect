import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { generateOrdonnancePdf } from '../../../lib/generateOrdonnancePdf';
import { getUser } from '../../../lib/useAuth';

const QUESTIONS_TOTAL = 15;

// ── Generate 15 random steps (4 directions, decreasing sizes)
function generateSequence() {
    const dirs = ['right', 'left', 'up', 'down'];
    const sizes = ['12rem', '11rem', '10rem', '9rem', '8rem', '7rem', '6rem', '5rem', '4rem', '3.5rem', '3rem', '2.5rem', '2rem', '1.7rem', '1.4rem'];
    return Array.from({ length: QUESTIONS_TOTAL }, (_, i) => ({
        direction: dirs[Math.floor(Math.random() * 4)],
        size: sizes[i],
    }));
}

// ── Prescription based on nombre de bonnes réponses / 15
function getOrdonnance(score, date) {
    const levels = [
        {
            min: 14, label: 'Excellent', color: 'emerald', title: 'Acuité visuelle excellente',
            diag: 'Score 14–15/15 — résultat très satisfaisant.',
            reco: 'Examen de contrôle recommandé dans 2 ans.', corr: null
        },
        {
            min: 10, label: 'Bon', color: 'blue', title: 'Bonne acuité visuelle',
            diag: 'Score 10–13/15 — bon niveau de réponses.',
            reco: 'Consultation ophtalmologique conseillée si symptômes. Correction possible.',
            corr: 'Correction estimée : sphère -0.50 à -1.00 dioptrie'
        },
        {
            min: 7, label: 'Moyen', color: 'amber', title: 'Acuité visuelle moyenne',
            diag: 'Score 7–9/15 — niveau moyen.',
            reco: 'Consultation ophtalmologique dans les 3 mois.',
            corr: 'Correction estimée : sphère -1.00 à -2.50 dioptries'
        },
        {
            min: 0, label: 'Faible', color: 'red', title: 'Acuité visuelle insuffisante',
            diag: 'Score sous 7/15 — résultat faible.',
            reco: 'Consultation ophtalmologique URGENTE.',
            corr: 'Correction estimée : sphère au-delà de -2,50 dioptries'
        },
    ];
    return { ...(levels.find(l => score >= l.min)), score, date };
}

// ── E letter with CSS rotation for 4 directions
function SnellenE({ dir, size }) {
    const rot = { right: 'rotate(0deg)', left: 'rotate(180deg)', up: 'rotate(-90deg)', down: 'rotate(90deg)' };
    return (
        <span style={{
            fontSize: size, display: 'inline-block', transform: rot[dir],
            fontFamily: 'serif', fontWeight: 900, color: '#0f172a', lineHeight: 1, transition: 'all 0.4s'
        }}>
            E
        </span>
    );
}

// ── Direction arrow display
const DIR_LABELS = { right: '→ Droite', left: '← Gauche', up: '↑ Haut', down: '↓ Bas' };

export default function TestVisuel() {
    const router = useRouter();
    const { id } = router.query;

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const faceRef = useRef(null);
    const handsRef = useRef(null);
    const cameraRef = useRef(null);
    const mountedRef = useRef(false);
    const validTimeRef = useRef(null);
    const correctAnswersRef = useRef(0);
    const gestureTimerRef = useRef(null);
    const isProcessingRef = useRef(false);
    const currentStepRef = useRef(0);
    const statusRef = useRef('INITIALIZING');
    const frameCountRef = useRef(0);
    const testPausedRef = useRef(false);
    const hasGlassesRef = useRef(false);
    const isDistanceOkRef = useRef(true); // tracks distance OK during test

    const [status, setStatus] = useState('INITIALIZING');
    const [distanceMsg, setDistanceMsg] = useState('Analyse en cours…');
    const [glassesMsg, setGlassesMsg] = useState('Vérification…');
    const [isDistanceOk, setIsDistanceOk] = useState(false);
    const [hasGlasses, setHasGlasses] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [detGesture, setDetGesture] = useState(null);
    const [stepResult, setStepResult] = useState(null);
    const [handDebug, setHandDebug] = useState('');
    const [finalScore, setFinalScore] = useState(0);
    const [ordonnance, setOrdonnance] = useState(null);
    const [sequence] = useState(generateSequence);
    const [testPaused, setTestPaused] = useState(false);
    const [distancePaused, setDistancePaused] = useState(false);  // NEW: pause for bad distance
    const [distancePauseMsg, setDistancePauseMsg] = useState('');      // NEW: message shown
    const [cameraAngle, setCameraAngle] = useState(null); // NEW: head/camera roll angle (deg)
    const [pdfLoading, setPdfLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const setStatusS = s => { statusRef.current = s; setStatus(s); };

    const countdownSpeechDoneRef = useRef(false);
    const lastDistancePausedRef = useRef(false);

    const speak = (text) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.88;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    const TARGET_EYE = 70, TOL = 15;

    const computeRollAngleDegFromEyes = (lm) => {
        if (!lm || !lm[33] || !lm[263]) return null;
        const le = lm[33], re = lm[263];
        const radians = Math.atan2((re.y - le.y), (re.x - le.x));
        const deg = radians * (180 / Math.PI);
        if (!Number.isFinite(deg)) return null;
        // Keep it in [-90, 90] range for readability
        let a = deg;
        while (a > 90) a -= 180;
        while (a < -90) a += 180;
        return Math.round(a);
    };

    useEffect(() => {
        const u = getUser();
        if (u) setCurrentUser(u);
    }, []);

    const loadScript = src => new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
        const s = document.createElement('script');
        s.src = src; s.crossOrigin = 'anonymous'; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
    });

    const lastFaceLmRef = useRef(null);

    // ── ML OpenCV Glasses Detection (Port 5001)
    const glassCheckBusy = useRef(false);

    const checkGlassesML = async () => {
        if (glassCheckBusy.current || !videoRef.current || !lastFaceLmRef.current) return;
        glassCheckBusy.current = true;
        try {
            const lm = lastFaceLmRef.current;
            const vw = videoRef.current.videoWidth || 320;
            const vh = videoRef.current.videoHeight || 240;

            const xA = lm[234].x * vw, xB = lm[454].x * vw;
            const yA = Math.min(lm[70].y, lm[300].y) * vh;
            const yB = lm[195].y * vh;

            const startX = Math.max(0, Math.min(xA, xB));
            const startY = Math.max(0, Math.min(yA, yB));
            const endX = Math.min(vw, Math.max(xA, xB));
            const endY = Math.min(vh, Math.max(yA, yB));
            const boxW = endX - startX;
            const boxH = endY - startY;

            if (boxW <= 0 || boxH <= 0) { glassCheckBusy.current = false; return; }

            const tmp = document.createElement('canvas');
            tmp.width = 96; tmp.height = 32;
            const ctx = tmp.getContext('2d');
            ctx.drawImage(videoRef.current, startX, startY, boxW, boxH, 0, 0, 96, 32);
            const base64 = tmp.toDataURL('image/jpeg', 0.9);

            const res = await fetch('http://localhost:5001/detect-glasses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 }),
                signal: AbortSignal.timeout(1500)
            });
            if (!res.ok) throw new Error('API failed');
            const data = await res.json();
            const g = Boolean(data.hasGlasses);

            if (statusRef.current === 'CALIBRATING' || statusRef.current === 'READY') {
                hasGlassesRef.current = g;
                setHasGlasses(g);
                setGlassesMsg(g ? 'Lunettes détectées — retirez-les svp.' : 'Sans lunettes ✓');
            }
            if (statusRef.current === 'TESTING' && g !== testPausedRef.current) {
                hasGlassesRef.current = g;
                testPausedRef.current = g; setTestPaused(g);
                if (g) {
                    speak('Veuillez enlever vos lunettes s\'il vous plaît.');
                    if (gestureTimerRef.current) {
                        clearTimeout(gestureTimerRef.current); gestureTimerRef.current = null;
                        setDetGesture(null);
                    }
                }
            }
        } catch (e) {
            console.warn('OpenCV API unavailable or error:', e.message);
        } finally {
            glassCheckBusy.current = false;
        }
    };

    // ── FaceMesh during TESTING for distance monitoring
    const onFaceResultsDuringTest = results => {
        if (statusRef.current !== 'TESTING') return;
        if (results.multiFaceLandmarks?.length > 0) {
            const lm = results.multiFaceLandmarks[0];
            lastFaceLmRef.current = lm;
            setCameraAngle(computeRollAngleDegFromEyes(lm));
            const le = lm[33], re = lm[263];
            const d = Math.abs(re.x - le.x) * 640; // normalized to 640px canvas
            const ok = d >= TARGET_EYE - TOL && d <= TARGET_EYE + TOL;
            isDistanceOkRef.current = ok;

            if (!ok) {
                const tooClose = d > TARGET_EYE + TOL;
                const msg = tooClose ? 'Reculez un peu — distance non autorisée !' : 'Approchez-vous — distance non autorisée !';
                if (!lastDistancePausedRef.current) {
                    lastDistancePausedRef.current = true;
                    speak(tooClose ? 'Veuillez reculer s\'il vous plaît.' : 'Veuillez vous rapprocher s\'il vous plaît.');
                }
                setDistancePaused(true);
                setDistancePauseMsg(msg);
                if (gestureTimerRef.current) {
                    clearTimeout(gestureTimerRef.current);
                    gestureTimerRef.current = null;
                    setDetGesture(null);
                }
            } else {
                lastDistancePausedRef.current = false;
                setDistancePaused(false);
                setDistancePauseMsg('');
            }
        } else {
            // No face detected during test
            isDistanceOkRef.current = false;
            setCameraAngle(null);
            if (!lastDistancePausedRef.current) {
                lastDistancePausedRef.current = true;
                speak('Visage non détecté. Veuillez vous repositionner s\'il vous plaît.');
            }
            setDistancePaused(true);
            setDistancePauseMsg('Visage non détecté — repositionnez-vous.');
        }
    };

    const onFaceResults = results => {
        if (!canvasRef.current) return;
        if (statusRef.current === 'TESTING' || statusRef.current === 'FINISHED') {
            // During test, run lightweight distance monitoring only
            onFaceResultsDuringTest(results);
            return;
        }

        const ctx = canvasRef.current.getContext('2d'), canvas = canvasRef.current;
        ctx.save(); ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.multiFaceLandmarks?.length > 0) {
            const lm = results.multiFaceLandmarks[0];
            lastFaceLmRef.current = lm;
            setCameraAngle(computeRollAngleDegFromEyes(lm));
            const le = lm[33], re = lm[263];
            const d = Math.abs(re.x - le.x) * canvas.width;
            let ok = false;
            if (d > TARGET_EYE + TOL) setDistanceMsg('Reculez un peu.');
            else if (d < TARGET_EYE - TOL) setDistanceMsg('Approchez-vous.');
            else { setDistanceMsg('Distance parfaite ! Maintenez.'); ok = true; }
            setIsDistanceOk(ok);

            const g = hasGlassesRef.current;
            ctx.strokeStyle = (ok && !g) ? '#10b981' : '#ef4444'; ctx.lineWidth = 3;
            ctx.strokeRect(le.x * canvas.width - 20, le.y * canvas.height - 20, d + 40, 40);
            if (ok && !g) {
                if (statusRef.current === 'CALIBRATING') setStatusS('READY');
                if (statusRef.current === 'READY') {
                    if (!validTimeRef.current) {
                        validTimeRef.current = Date.now();
                        if (!countdownSpeechDoneRef.current) {
                            countdownSpeechDoneRef.current = true;
                            speak('Le test commencera après 10 secondes. Restez à 1 mètre de l\'écran.');
                        }
                    } else {
                        const rem = Math.ceil((10000 - (Date.now() - validTimeRef.current)) / 1000);
                        if (rem > 0) setCountdown(rem);
                        else startTest();
                    }
                }
            } else {
                validTimeRef.current = null; setCountdown(null);
                countdownSpeechDoneRef.current = false;
                if (statusRef.current === 'READY') setStatusS('CALIBRATING');
            }
        } else {
            setDistanceMsg('Visage non détecté.'); setIsDistanceOk(false); setHasGlasses(false);
            setCameraAngle(null);
            validTimeRef.current = null; setCountdown(null);
            if (statusRef.current === 'READY') setStatusS('CALIBRATING');
        }
        ctx.restore();
    };

    // ── Detect pointing direction from THUMB
    const getPointDir = lm => {
        const tip = lm[4];
        const base = lm[2];
        const dx = tip.x - base.x;
        const dy = tip.y - base.y;
        const minDist = 0.04;
        if (Math.abs(dx) < minDist && Math.abs(dy) < minDist) return null;
        if (Math.abs(dy) > Math.abs(dx)) {
            return dy < 0 ? 'up' : 'down';
        } else {
            return dx < 0 ? 'right' : 'left';
        }
    };

    const onHandResults = results => {
        if (!canvasRef.current || statusRef.current !== 'TESTING') return;
        const ctx = canvasRef.current.getContext('2d'), canvas = canvasRef.current;
        ctx.save(); ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        const hands = results.multiHandLandmarks || [];
        if (hands.length > 0 && !isProcessingRef.current) {
            const lm = hands[0];
            lm.forEach(p => {
                ctx.beginPath(); ctx.arc(p.x * canvas.width, p.y * canvas.height, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#60a5fa'; ctx.fill();
            });
            const dir = getPointDir(lm);
            const wristY = lm[0].y;
            setHandDebug(`poignet Y=${wristY.toFixed(2)} | direction=${dir || '—'}`);

            // Only process gesture if distance is OK and not paused by glasses
            const canProcess = !testPausedRef.current && isDistanceOkRef.current;
            if (dir && wristY < 0.8 && canProcess) {
                setDetGesture(dir);
                if (!gestureTimerRef.current) {
                    gestureTimerRef.current = setTimeout(() => {
                        gestureTimerRef.current = null;
                        processGesture(dir);
                    }, 500);
                }
            } else {
                setDetGesture(null);
                if (gestureTimerRef.current) { clearTimeout(gestureTimerRef.current); gestureTimerRef.current = null; }
            }
        } else {
            setHandDebug('Aucune main visible'); setDetGesture(null);
            if (gestureTimerRef.current) { clearTimeout(gestureTimerRef.current); gestureTimerRef.current = null; }
        }
        ctx.restore();
    };

    const processGesture = dir => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        const step = sequence[currentStepRef.current];
        const correct = dir === step.direction;
        if (correct) correctAnswersRef.current += 1;
        setStepResult(correct ? 'correct' : 'wrong');
        setTimeout(() => {
            setStepResult(null); setDetGesture(null); isProcessingRef.current = false;
            const next = currentStepRef.current + 1;
            if (next < sequence.length) {
                currentStepRef.current = next; setCurrentStep(next);
            } else {
                endTest(correctAnswersRef.current);
            }
        }, 700);
    };

    const startTest = () => {
        if (statusRef.current === 'TESTING' || statusRef.current === 'FINISHED') return;
        setStatusS('TESTING'); validTimeRef.current = null; setCountdown(null);
        correctAnswersRef.current = 0;
        currentStepRef.current = 0; setCurrentStep(0); isProcessingRef.current = false;
        testPausedRef.current = false; setTestPaused(false);
        setDistancePaused(false); isDistanceOkRef.current = true;
        // Keep faceRef alive for distance & glasses monitoring during test
        if (cameraRef.current) { try { cameraRef.current.stop(); } catch (e) { } cameraRef.current = null; }
        setTimeout(initHands, 300);
    };

    const initHands = () => {
        if (!window.Hands || !window.Camera || !videoRef.current) { setTimeout(initHands, 400); return; }
        const h = new window.Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}` });
        h.setOptions({
            maxNumHands: 1, modelComplexity: 0,
            minDetectionConfidence: 0.55, minTrackingConfidence: 0.45
        });
        h.onResults(onHandResults); handsRef.current = h;

        // Re-init FaceMesh camera for distance monitoring during test (low freq)
        if (faceRef.current && window.Camera) {
            const faceCam = new window.Camera(videoRef.current, {
                onFrame: async () => {
                    frameCountRef.current++;
                    if (handsRef.current && statusRef.current === 'TESTING')
                        await handsRef.current.send({ image: videoRef.current });
                    // FaceMesh every 45 frames for distance check during test
                    if (frameCountRef.current % 45 === 0 && faceRef.current && statusRef.current === 'TESTING')
                        await faceRef.current.send({ image: videoRef.current });
                    // ML glasses check every 90 frames
                    if (frameCountRef.current % 90 === 0) checkGlassesML();
                },
                width: 320, height: 240
            });
            cameraRef.current = faceCam; faceCam.start();
        } else {
            const cam = new window.Camera(videoRef.current, {
                onFrame: async () => {
                    frameCountRef.current++;
                    if (statusRef.current === 'TESTING') {
                        if (handsRef.current) await handsRef.current.send({ image: videoRef.current });
                        if (frameCountRef.current % 90 === 0) checkGlassesML();
                    }
                },
                width: 320, height: 240
            });
            cameraRef.current = cam; cam.start();
        }
    };

    const endTest = async score => {
        setStatusS('FINISHED'); setFinalScore(score);
        const ord = getOrdonnance(score, new Date().toLocaleDateString('fr-FR'));
        setOrdonnance(ord);
        try { localStorage.setItem('derniere_ordonnance', JSON.stringify({ ...ord, score, date: new Date().toLocaleDateString('fr-FR') })); } catch (e) { }
        if (gestureTimerRef.current) { clearTimeout(gestureTimerRef.current); gestureTimerRef.current = null; }
        if (cameraRef.current) { try { cameraRef.current.stop(); } catch (e) { } cameraRef.current = null; }
        if (handsRef.current) { try { handsRef.current.close(); } catch (e) { } handsRef.current = null; }
        if (faceRef.current) { try { faceRef.current.close(); } catch (e) { } faceRef.current = null; }
        try { await fetchApi(`/patients/demandes/${id}/tests/soumettre?score=${score}`, { method: 'POST' }); }
        catch (err) { console.error('Erreur soumission:', err); }
    };

    const handleDownloadPdf = async () => {
        if (!ordonnance) return;
        setPdfLoading(true);
        try {
            await generateOrdonnancePdf(ordonnance, currentUser);
        } catch (e) {
            console.error('Erreur PDF:', e);
            alert('Erreur lors de la génération du PDF.');
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        if (mountedRef.current) return; mountedRef.current = true;
        const boot = async () => {
            try {
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js');
                waitFace();
            } catch (err) { console.error(err); setDistanceMsg('Erreur réseau. Rechargez.'); }
        };
        const waitFace = () => {
            if (!window.FaceMesh || !window.Camera || !videoRef.current) { setTimeout(waitFace, 400); return; }
            const fm = new window.FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${f}` });
            fm.setOptions({
                maxNumFaces: 1, refineLandmarks: true, modelComplexity: 0,
                minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
            });
            fm.onResults(onFaceResults); faceRef.current = fm;
            const cam = new window.Camera(videoRef.current, {
                onFrame: async () => {
                    frameCountRef.current++;
                    if (faceRef.current && (statusRef.current === 'CALIBRATING' || statusRef.current === 'READY'))
                        await faceRef.current.send({ image: videoRef.current });
                    if (frameCountRef.current % 30 === 0) checkGlassesML();
                },
                width: 320, height: 240
            });
            cameraRef.current = cam; cam.start(); setStatusS('CALIBRATING');
        };
        boot();
        return () => {
            if (cameraRef.current) try { cameraRef.current.stop(); } catch (e) { }
            if (faceRef.current) try { faceRef.current.close(); } catch (e) { }
            if (handsRef.current) try { handsRef.current.close(); } catch (e) { }
            if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
        };
    }, []);

    // ── Color helpers for ordonnance
    const ordColors = {
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700', score: 'text-emerald-700' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700', score: 'text-blue-700' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700', score: 'text-amber-700' },
        red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-700', score: 'text-red-700' },
    };

    return (
        <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden">
            <Head>
                <title>Test Visuel IA | ŒilDirect</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@300,1&display=swap" rel="stylesheet" />
            </Head>
            <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-slate-900 via-slate-950 to-black" />

            {/* HEADER */}
            <div className="absolute top-0 w-full px-6 py-4 flex justify-between items-center z-50 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <img src="/logos/logo_cabinet.png" alt="ŒilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left brightness-0 invert" />
                </div>
                <Link href="/patient" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm border border-slate-700">Quitter</Link>
            </div>

            <div className="relative w-full max-w-5xl z-10 pt-24 pb-10 px-4">

                {/* ─── CALIBRATION ─── */}
                {['INITIALIZING', 'CALIBRATING', 'READY'].includes(status) && (
                    <div className="flex flex-col md:flex-row gap-6 w-full">
                        {/* Camera */}
                        <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl min-h-[360px]">
                            <video ref={videoRef} className="hidden" playsInline muted />
                            <canvas ref={canvasRef} width="640" height="480" className="w-full h-auto" style={{ transform: 'scaleX(-1)' }} />
                            {status === 'INITIALIZING' && (
                                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur flex flex-col items-center justify-center gap-4">
                                    <span className="material-symbols-outlined text-5xl text-blue-400 animate-spin">settings</span>
                                    <p className="text-slate-300 text-center px-6">Chargement de l'IA…</p>
                                </div>
                            )}
                            {status !== 'INITIALIZING' && (
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-mono text-green-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> REC • IA ACTIVE
                                </div>
                            )}
                        </div>
                        {/* Panel */}
                        <div className="w-full md:w-80 flex flex-col gap-4">
                            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                                <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-4">Calibrage</p>
                                <div className="flex items-start gap-3 mb-4">
                                    <span className={`material-symbols-outlined mt-0.5 ${isDistanceOk ? 'text-green-500' : 'text-amber-500'}`}>{isDistanceOk ? 'check_circle' : 'straighten'}</span>
                                    <div><p className="text-sm font-semibold text-slate-200">Distance 1 Mètre</p><p className={`text-xs mt-1 ${isDistanceOk ? 'text-green-400' : 'text-slate-400'}`}>{distanceMsg}</p></div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className={`material-symbols-outlined mt-0.5 ${hasGlasses ? 'text-red-500' : 'text-green-500'}`}>{hasGlasses ? 'glasses' : 'face'}</span>
                                    <div><p className="text-sm font-semibold text-slate-200">Lunettes</p><p className={`text-xs mt-1 ${hasGlasses ? 'text-red-400 font-semibold' : 'text-green-400'}`}>{glassesMsg}</p></div>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[150px] text-center">
                                {status === 'READY' ? (
                                    <>
                                        <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
                                            <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                                <circle cx="40" cy="40" r="34" strokeWidth="5" fill="none" className="stroke-slate-800" />
                                                <circle cx="40" cy="40" r="34" strokeWidth="5" fill="none" strokeLinecap="round"
                                                    strokeDasharray="213" strokeDashoffset={213 - (213 * ((countdown ? 11 - countdown : 0) / 10))}
                                                    className="stroke-blue-500 transition-all duration-[950ms] ease-linear" />
                                            </svg>
                                            <span className="text-3xl font-black text-white z-10">{countdown ?? 10}</span>
                                        </div>
                                        <p className="text-sm font-bold text-white">Prêt !</p>
                                        <p className="text-xs text-slate-400 mt-1">Démarrage dans {countdown ?? 10}s…</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-4xl text-slate-700 mb-2 animate-pulse">lock</span>
                                        <p className="text-sm text-slate-500 font-semibold">Test verrouillé</p>
                                        <p className="text-xs text-slate-600 mt-1">Respectez les consignes</p>
                                    </>
                                )}
                            </div>
                            <div className="bg-blue-950/40 border border-blue-800/30 p-4 rounded-xl">
                                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-3">Instructions</p>
                                <ul className="text-xs text-slate-400 space-y-1.5">
                                    <li>📏 Restez à <strong className="text-white">1 mètre</strong></li>
                                    <li>👓 Retirez les lunettes si besoin</li>
                                    <li>👍 Levez votre main et pointez votre <strong className="text-white">pouce</strong> dans la direction du E</li>
                                    <li>👆 ↑ haut &nbsp; ↓ bas &nbsp; → droite &nbsp; ← gauche</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TESTING ─── */}
                {status === 'TESTING' && (
                    <div className="flex flex-col md:flex-row gap-6 w-full items-start relative pb-20">

                        {/* GLASSES BLOCKING OVERLAY */}
                        {testPaused && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-red-950/95 backdrop-blur-sm rounded-2xl">
                                <span className="material-symbols-outlined text-red-400 text-6xl animate-pulse">glasses</span>
                                <h3 className="text-2xl font-black text-white text-center">Test mis en pause !</h3>
                                <p className="text-red-300 text-center max-w-xs">
                                    Lunettes détectées pendant le test.<br />Veuillez les retirer pour continuer.
                                </p>
                                <div className="flex items-center gap-2 text-xs text-red-400 font-mono">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                    Surveillance active…
                                </div>
                            </div>
                        )}

                        {/* DISTANCE WARNING OVERLAY */}
                        {!testPaused && distancePaused && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-amber-950/95 backdrop-blur-sm rounded-2xl">
                                <span className="material-symbols-outlined text-amber-400 text-7xl animate-bounce">straighten</span>
                                <h3 className="text-2xl font-black text-white text-center">Test suspendu</h3>
                                <div className="bg-amber-900/60 border border-amber-600/50 rounded-xl px-6 py-4 text-center max-w-sm">
                                    <p className="text-amber-200 font-bold text-lg">{distancePauseMsg}</p>
                                    <p className="text-amber-400 text-sm mt-2">Maintenez-vous à environ <strong className="text-white">1 mètre</strong> de l'écran pour reprendre.</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono mt-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                    Surveillance de la distance en cours…
                                </div>
                            </div>
                        )}

                        {/* Left: camera + debug */}
                        <div className="flex-shrink-0 w-full md:w-[420px] flex flex-col gap-3">
                            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-xl" style={{ aspectRatio: '4/3' }}>
                                <video ref={videoRef} className="hidden" playsInline muted />
                                <canvas ref={canvasRef} width="640" height="480" className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                                {/* Angle overlay */}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded-lg text-[11px] font-mono text-slate-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-blue-300">screen_rotation</span>
                                    <span>Angle: {cameraAngle === null ? '—' : `${cameraAngle}°`}</span>
                                </div>
                                <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
                                    {detGesture ? (
                                        <div className="text-center text-xs font-bold px-2 py-1 rounded-full bg-blue-600 text-white">
                                            {DIR_LABELS[detGesture]} détecté…
                                        </div>
                                    ) : (
                                        <div className="text-center text-xs text-slate-400 font-mono bg-black/60 px-2 py-1 rounded-full">
                                            Pointez votre 👍 pouce dans la bonne direction
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Snellen */}
                        <div className="flex-1 flex flex-col gap-4">
                            <div className={`flex items-center justify-center rounded-2xl shadow-2xl min-h-[380px] border-4 transition-all duration-300
                                ${stepResult === 'correct' ? 'bg-green-50 border-green-400' : stepResult === 'wrong' ? 'bg-red-50 border-red-400' : 'bg-white border-white'}`}>
                                {stepResult === 'correct' && <div className="flex flex-col items-center gap-3"><span className="text-7xl">✅</span><p className="text-green-700 font-bold text-xl">Correct !</p></div>}
                                {stepResult === 'wrong' && <div className="flex flex-col items-center gap-3"><span className="text-7xl">❌</span><p className="text-red-700 font-bold text-xl">Mauvaise réponse</p></div>}
                                {!stepResult && sequence[currentStep] && <SnellenE dir={sequence[currentStep].direction} size={sequence[currentStep].size} />}
                            </div>
                        </div>

                        {/* Bottom progress band (questions restantes) */}
                        <div className="absolute left-0 right-0 bottom-0 z-40">
                            <div className="mx-auto w-full max-w-5xl px-3 pb-3">
                                <div className="bg-slate-950/85 backdrop-blur border border-slate-800/70 rounded-2xl px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs text-slate-300 font-semibold">
                                            Étape <span className="text-white font-black">{currentStep + 1}</span> / {sequence.length}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Questions restantes: <span className="text-white font-bold">{Math.max(0, sequence.length - (currentStep + 1))}</span>
                                        </p>
                                    </div>
                                    <div className="mt-2 flex gap-0.5">
                                        {sequence.map((_, i) => (
                                            <div
                                                key={i}
                                                className={[
                                                    'h-2 flex-1 rounded-full transition-all duration-300',
                                                    i < currentStep ? 'bg-emerald-500' : i === currentStep ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'
                                                ].join(' ')}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── FINISHED + ORDONNANCE ─── */}
                {status === 'FINISHED' && ordonnance && (() => {
                    const c = ordColors[ordonnance.color] || ordColors.emerald;
                    return (
                        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
                            {/* Score card */}
                            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                                {/* Header */}
                                <div className={`${c.bg} ${c.border} border-b px-8 py-6 flex items-center justify-between`}>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">ŒilDirect — Résultat de Test</p>
                                        <h2 className={`text-2xl font-black ${c.score}`}>{ordonnance.title}</h2>
                                        <p className="text-xs text-slate-500 mt-1">{ordonnance.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-6xl font-black ${c.score}`}>{finalScore}</span>
                                        <span className={`text-2xl ${c.score}`}>/15</span>
                                    </div>
                                </div>
                                {/* Body — Ordonnance */}
                                <div className="p-8 text-slate-800">
                                    <div className="flex items-start gap-3 mb-4">
                                        <span className="material-symbols-outlined text-slate-500 mt-0.5">diagnosis</span>
                                        <div>
                                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Diagnostic</p>
                                            <p className="font-semibold">{ordonnance.diag}</p>
                                        </div>
                                    </div>
                                    {ordonnance.corr && (
                                        <div className={`${c.bg} ${c.border} border rounded-xl p-4 mb-4`}>
                                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Correction Optique Estimée</p>
                                            <p className={`font-bold ${c.text}`}>{ordonnance.corr}</p>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-3 mb-6">
                                        <span className="material-symbols-outlined text-slate-500 mt-0.5">medical_services</span>
                                        <div>
                                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Recommandation</p>
                                            <p className="font-semibold">{ordonnance.reco}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-400">
                                        ⚠️ Ce résultat est indicatif et ne remplace pas une consultation auprès d'un ophtalmologue qualifié.
                                    </div>
                                </div>
                                {/* Buttons */}
                                <div className="px-8 pb-8 flex gap-3">
                                    <button
                                        onClick={handleDownloadPdf}
                                        disabled={pdfLoading}
                                        className={`flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${pdfLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{pdfLoading ? 'hourglass_empty' : 'download'}</span>
                                        {pdfLoading ? 'Génération...' : 'Télécharger l\'ordonnance (PDF)'}
                                    </button>
                                    <button onClick={() => router.push('/patient')}
                                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all">
                                        Tableau de bord →
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
