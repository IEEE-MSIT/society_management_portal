import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { Shield, Printer, Award, Loader2, ArrowLeft } from 'lucide-react';

interface CertificateData {
  id: string;
  member: {
    firstName: string;
    lastName: string;
  };
  awardRule: {
    name: string;
  };
  period: string;
  winner: {
    qrCodeUrl: string;
  } | null;
}

const CertificateView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/awards/nominations/${id}`);
        if (res.data?.success) {
          setData(res.data.nomination);
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to load certificate record', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400">Verifying digital certificate signature...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-4">
          <Award className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-350">Invalid Certificate Reference</h2>
          <p className="text-xs text-slate-500">This certificate ID does not exist or has been revoked.</p>
        </div>
      </div>
    );
  }

  const formatPeriod = (p: string) => {
    const [year, month] = p.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 flex flex-col items-center justify-center gap-6 print:bg-white print:py-0 print:px-0">
      {/* Control Actions bar */}
      <div className="flex items-center justify-between w-full max-w-4xl bg-slate-900/60 border border-slate-850 p-4 rounded-2xl print:hidden">
        <button
          onClick={() => window.close()}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Close Window
        </button>
        <button
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(79,70,229,0.2)] cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Traditional Frame Printable Certificate */}
      <div className="w-full max-w-4xl bg-slate-900 text-slate-100 border-[12px] border-double border-amber-500/40 p-12 md:p-20 relative overflow-hidden shadow-2xl print:bg-white print:text-black print:border-black print:shadow-none print:w-full print:max-w-none print:m-0">
        {/* Certificate Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none print:opacity-[0.05]">
          <Award className="w-[400px] h-[400px] text-amber-500" />
        </div>

        <div className="flex flex-col items-center text-center space-y-10 relative z-10">
          {/* Header Shield */}
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-14 w-14 text-amber-500 print:text-black" />
            <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-slate-400 print:text-black">
              IEEE Student Branch Society Portal
            </span>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h2 className="text-3xl md:text-5xl font-serif text-amber-500 tracking-wide font-medium print:text-black">
              Certificate of Achievement
            </h2>
            <div className="h-0.5 w-40 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto print:bg-black" />
          </div>

          {/* Recipient Details */}
          <div className="space-y-4">
            <p className="font-serif italic text-slate-400 text-base md:text-lg print:text-black">
              This certificate is proudly presented to
            </p>
            <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-sans print:text-black">
              {data.member.firstName} {data.member.lastName}
            </h3>
            <div className="h-0.5 w-60 bg-gradient-to-r from-transparent via-slate-700 to-transparent mx-auto print:bg-black" />
          </div>

          {/* Recognition text */}
          <p className="max-w-xl text-sm md:text-base leading-relaxed text-slate-350 font-serif print:text-black">
            for outstanding dedication, active volunteering, and valuable technical/event contributions resulting in the recognition as the recipient of the
            <span className="block text-amber-500 font-sans font-black text-lg md:text-xl uppercase tracking-wider mt-4 print:text-black">
              {data.awardRule.name}
            </span>
            <span className="block text-slate-400 text-xs md:text-sm mt-1 print:text-black">
              awarded for the period of {formatPeriod(data.period)}
            </span>
          </p>

          {/* Footer QR Verification Code */}
          <div className="flex flex-col md:flex-row items-center justify-between w-full border-t border-slate-800/80 pt-8 mt-6 gap-6 print:border-black print:text-black">
            <div className="text-left space-y-1 text-xs text-slate-500 print:text-black">
              <p className="font-bold text-slate-400 print:text-black">Digitally Verified Reference:</p>
              <p className="font-mono">{data.id}</p>
              <p>Generated: {new Date().toLocaleDateString()}</p>
            </div>
            {data.winner?.qrCodeUrl && (
              <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-850 print:bg-white print:border-black">
                <img
                  src={data.winner.qrCodeUrl}
                  alt="Verification QR Code"
                  className="w-20 h-20 bg-white p-1 rounded"
                />
                <div className="text-left text-[9px] text-slate-500 max-w-[120px] print:text-black">
                  <p className="font-bold text-slate-400 print:text-black">Verification QR</p>
                  <p>Scan code with any mobile scanner to check certificate authenticity status online.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
