import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listFunds } from '../api/funds';
import { uploadNavCsv } from '../api/nav';
import { uploadFactsheet, confirmFactsheet } from '../api/factsheets';
import type { FactsheetExtraction } from '../types/api';
import { formatExpenseRatio, formatCurrency } from '../utils/format';
import PageWrapper from '../components/layout/PageWrapper';
import FileDropzone from '../components/upload/FileDropzone';
import UploadProgress from '../components/upload/UploadProgress';

type Tab = 'factsheet' | 'nav';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<Tab>('factsheet');

  return (
    <PageWrapper>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload Data</h1>
      <p className="text-sm text-gray-500 mb-6">Import factsheet PDFs or NAV CSV files</p>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab('factsheet')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'factsheet'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Factsheet PDF
        </button>
        <button
          onClick={() => setActiveTab('nav')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'nav'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          NAV CSV
        </button>
      </div>

      {activeTab === 'factsheet' ? <FactsheetTab /> : <NavCsvTab />}
    </PageWrapper>
  );
}

function FactsheetTab() {
  const [extraction, setExtraction] = useState<FactsheetExtraction | null>(null);
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [factsheetDate, setFactsheetDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: funds } = useQuery({
    queryKey: ['funds'],
    queryFn: listFunds,
    staleTime: 5 * 60 * 1000,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFactsheet,
    onSuccess: (data) => {
      setExtraction(data);
      if (data.matched_fund_id) {
        setSelectedFundId(data.matched_fund_id);
      }
      toast.success('PDF extracted successfully!');
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail || 'PDF extraction failed');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: confirmFactsheet,
    onSuccess: () => {
      toast.success('Factsheet data saved!');
      setExtraction(null);
      setSelectedFundId('');
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail || 'Failed to save factsheet data');
    },
  });

  const confidenceColor =
    (extraction?.match_confidence || 0) >= 85
      ? 'bg-green-100 text-green-700'
      : (extraction?.match_confidence || 0) >= 70
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';

  return (
    <div className="space-y-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFile={(file) => uploadMutation.mutate(file)}
        label="Drop a factsheet PDF here, or click to select"
        hint="PDF files only"
        disabled={uploadMutation.isPending}
      />

      <UploadProgress
        isUploading={uploadMutation.isPending}
        fileName={uploadMutation.variables?.name}
      />

      {/* Extraction Results */}
      {extraction && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Extracted Data</h2>

          {/* Match confidence */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${confidenceColor}`}>
              Match: {extraction.match_confidence.toFixed(0)}%
            </span>
            {extraction.matched_fund_id && (
              <span className="text-xs text-green-600 font-medium">
                ✓ Auto-matched
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Fund Name</p>
              <p className="text-sm font-medium text-gray-900">{extraction.extracted.fund_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">AMC</p>
              <p className="text-sm font-medium text-gray-900">{extraction.extracted.amc || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Expense Ratio</p>
              <p className="text-sm font-medium text-gray-900">
                {formatExpenseRatio(extraction.extracted.expense_ratio)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">AUM</p>
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(extraction.extracted.aum_cr)}
              </p>
            </div>
          </div>

          {/* Top 5 Holdings preview */}
          {extraction.extracted.top_holdings.length > 0 && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase mb-2">Top Holdings</p>
              <div className="space-y-1">
                {extraction.extracted.top_holdings.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{h.company_name}</span>
                    <span className="text-gray-500">{h.allocation_pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Link to Fund</label>
                <select
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-w-[240px]"
                >
                  <option value="">Select a fund...</option>
                  {funds?.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-1">Factsheet Date</label>
                <input
                  type="date"
                  value={factsheetDate}
                  onChange={(e) => setFactsheetDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button
                onClick={() => {
                  if (!selectedFundId) {
                    toast.error('Please select a fund');
                    return;
                  }
                  confirmMutation.mutate({
                    fund_id: selectedFundId,
                    extracted_data: extraction.extracted,
                    factsheet_date: factsheetDate,
                  });
                }}
                disabled={confirmMutation.isPending || !selectedFundId}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirmMutation.isPending ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavCsvTab() {
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<{
    inserted: number;
    updated: number;
    skipped: number;
    warnings: string[];
  } | null>(null);
  const [showWarnings, setShowWarnings] = useState(false);

  const { data: funds } = useQuery({
    queryKey: ['funds'],
    queryFn: listFunds,
    staleTime: 5 * 60 * 1000,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadNavCsv(selectedFundId, file),
    onSuccess: (data) => {
      setUploadResult(data);
      toast.success(`Upload complete! ${data.inserted} records inserted.`);
    },
    onError: (err: { detail?: string }) => {
      toast.error(err.detail || 'NAV upload failed');
    },
  });

  return (
    <div className="space-y-6">
      {/* Fund Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Fund</label>
        <select
          value={selectedFundId}
          onChange={(e) => {
            setSelectedFundId(e.target.value);
            setUploadResult(null);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full max-w-md"
        >
          <option value="">Choose a fund...</option>
          {funds?.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      <FileDropzone
        accept={{ 'text/csv': ['.csv'] }}
        onFile={(file) => {
          if (!selectedFundId) {
            toast.error('Please select a fund first');
            return;
          }
          uploadMutation.mutate(file);
        }}
        label="Drop a NAV CSV file here, or click to select"
        hint="CSV with columns: date, nav_value"
        disabled={!selectedFundId || uploadMutation.isPending}
      />

      <UploadProgress
        isUploading={uploadMutation.isPending}
        fileName={uploadMutation.variables?.name}
      />

      {/* Upload Result */}
      {uploadResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{uploadResult.inserted.toLocaleString()}</p>
              <p className="text-xs text-green-600">Inserted</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{uploadResult.updated.toLocaleString()}</p>
              <p className="text-xs text-blue-600">Updated</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-700">{uploadResult.skipped.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Skipped</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-700">{uploadResult.warnings.length}</p>
              <p className="text-xs text-amber-600">Warnings</p>
            </div>
          </div>

          {uploadResult.warnings.length > 0 && (
            <div>
              <button
                onClick={() => setShowWarnings(!showWarnings)}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
              >
                {showWarnings ? '▾ Hide' : '▸ Show'} {uploadResult.warnings.length} warnings
              </button>
              {showWarnings && (
                <ul className="mt-2 space-y-1 text-sm text-gray-600 bg-amber-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  {uploadResult.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">⚠</span>
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
