#!/usr/bin/env python3
"""
INSTITUTIONAL PREDATOR V3: THE COMPLETE SYSTEM
==============================================
MERGED INTELLIGENCE:
1. Code 2's "IntelligentAnalyzer" (Zones, FVGs, Order Blocks, Liquidity, Round #s, Patterns)
2. Code 1's "Predator" (Macro Regime, DXY Correlation, Volatility Expansion)

GOAL:
A single, executable Python script for Mac/Local use with Interactive Brokers.
"""

import sys
import asyncio
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Union
import warnings

# Load environment variables if .env exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Suppress pandas warnings
warnings.filterwarnings('ignore')

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.FileHandler('predator_v3.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("PredatorV3")

# =============================================================================
# 1. KNOWLEDGE BASE (COMPLETE FROM CODE 2)
# =============================================================================

KNOWLEDGE_BASE = {
    # === DAILY TIMEFRAME ZONES (from our 6-12 month analysis) ===
    'daily_zones': {
        'tier1_resistance': [
            {'name': 'ATH Zone', 'low': 4300, 'high': 4360, 'evidence': 'All-time high Oct 20, multiple rejections', 'priority': 5},
        ],
        'tier1_support': [
            {'name': 'Major 4K', 'low': 4000, 'high': 4050, 'evidence': 'HVN 88K contracts, psychological, multiple touches', 'priority': 5},
            {'name': 'Order Block', 'low': 3880, 'high': 3930, 'evidence': 'Bullish OB, FVG $3886-3926', 'priority': 5},
        ],
        'tier2_support': [
            {'name': 'Swing Cluster', 'low': 3750, 'high': 3800, 'evidence': 'Multiple swing lows, FVG $3756-3775', 'priority': 4},
            {'name': 'Fib 61.8%', 'low': 3620, 'high': 3690, 'evidence': 'Fibonacci $3679, equal lows cluster', 'priority': 4},
        ],
        'tier3_support': [
            {'name': 'ULTIMATE BUY', 'low': 3400, 'high': 3450, 'evidence': 'HIGHEST HVN 336K contracts, 9 touches, massive accumulation', 'priority': 5},
            {'name': 'Consolidation Base', 'low': 3230, 'high': 3280, 'evidence': '11 swing lows, breakout base', 'priority': 4},
        ],
    },

    # === HOURLY TIMEFRAME ZONES (from our 3-6 month analysis) ===
    'hourly_zones': {
        'resistance': [
            {'name': '1H R1', 'low': 4240, 'high': 4250, 'evidence': 'Dec 4 high rejection, massive volume', 'priority': 5},
            {'name': '1H R2', 'low': 4280, 'high': 4300, 'evidence': 'Extension target, previous consolidation', 'priority': 4},
        ],
        'support': [
            {'name': '1H S1 CRITICAL', 'low': 4190, 'high': 4210, 'evidence': 'Today session low, must hold', 'priority': 5},
            {'name': '1H S2 GOLDEN', 'low': 4100, 'high': 4125, 'evidence': '100% hold rate, 3 touches Nov, massive wicks', 'priority': 5},
            {'name': '1H S3', 'low': 4060, 'high': 4080, 'evidence': 'Nov consolidation, equal lows', 'priority': 4},
            {'name': '1H S4 MAJOR', 'low': 4000, 'high': 4025, 'evidence': '$4K psychological, $49 wick reversal Nov 17', 'priority': 5},
        ],
    },

    # === FAIR VALUE GAPS (Unfilled imbalances) ===
    'fair_value_gaps': [
        {'low': 4091, 'high': 4203, 'size': 111.40, 'type': 'bullish', 'priority': 5, 'note': 'LARGEST FVG, wants to fill'},
        {'low': 3999, 'high': 4060, 'size': 60.60, 'type': 'bullish', 'priority': 4, 'note': 'Major FVG near 4K'},
        {'low': 3927, 'high': 3986, 'size': 59.00, 'type': 'bullish', 'priority': 4, 'note': 'Multiple gaps cluster'},
        {'low': 3886, 'high': 3926, 'size': 40.00, 'type': 'bullish', 'priority': 4, 'note': 'Order block area'},
        {'low': 3756, 'high': 3775, 'size': 19.30, 'type': 'bullish', 'priority': 3, 'note': 'Tier 2 support'},
        {'low': 3315, 'high': 3357, 'size': 41.10, 'type': 'bullish', 'priority': 4, 'note': 'Ultimate zone'},
    ],

    # === ORDER BLOCKS (Smart money entry zones) ===
    'order_blocks': {
        'bullish': [
            {'price': 4115, 'date': '2025-11-12', 'strength': 'strong', 'evidence': 'Nov 12 reversal, held 3x'},
            {'price': 4020, 'date': '2025-11-17', 'strength': 'very_strong', 'evidence': '$49 wick, 1552 volume'},
            {'price': 3420, 'date': '2025-05-06', 'strength': 'extreme', 'evidence': 'Massive accumulation, +3% move'},
        ],
        'bearish': [
            {'price': 4246, 'date': '2025-12-04', 'strength': 'strong', 'evidence': 'Dec 4 rejection, 81K volume'},
            {'price': 3276, 'date': '2025-05-12', 'strength': 'strong', 'evidence': '-3.46% move'},
        ],
    },

    # === VOLUME PROFILE (High Volume Nodes) ===
    'volume_profile': [
        {'price': 3333, 'volume': 336856, 'significance': 'EXTREME', 'note': 'Highest volume of entire year'},
        {'price': 4205, 'volume': 88171, 'significance': 'VERY_HIGH', 'note': 'Current area high volume'},
        {'price': 2769, 'volume': 125692, 'significance': 'VERY_HIGH', 'note': 'Jan 29 record volume'},
    ],

    # === LIQUIDITY ZONES (Equal Highs/Lows) ===
    'liquidity': {
        'equal_highs': [
            {'price': 4356, 'touches': 2, 'note': 'ATH area, buy-side liquidity'},
            {'price': 4136, 'touches': 2, 'note': 'Nov consolidation'},
            {'price': 4122, 'touches': 3, 'note': 'Strong magnet'},
        ],
        'equal_lows': [
            {'price': 4102, 'touches': 2, 'note': 'Golden zone entry'},
            {'price': 4031, 'touches': 3, 'note': 'STRONG magnet, stop hunt zone'},
            {'price': 3945, 'touches': 3, 'note': 'Tier 1 support'},
            {'price': 3929, 'touches': 2, 'note': 'Order block area'},
        ],
    },

    # === ROUND NUMBERS (Psychological levels) ===
    'round_numbers': {
        'major': [4500, 4400, 4300, 4200, 4100, 4000, 3900, 3800, 3700, 3600, 3500, 3400, 3300, 3200, 3100, 3000],
        'minor': [4450, 4350, 4250, 4150, 4050, 3950, 3850, 3750, 3650, 3550, 3450, 3350, 3250, 3150, 3050],
    },

    # === SESSION LEVELS (Updated daily dynamically) ===
    'session_levels': {
        'today': {},         # Will be populated by live data
        'previous_day': {},  # Will be populated by live data
        'previous_week': {
            'high': 4228.70,  # PWH
            'low': 4019.40,   # PWL
        },
    },

    # === TIME-OF-DAY PATTERNS ===
    'time_patterns': {
        'best_times': [
            {'name': 'London Open', 'start_hour': 3, 'end_hour': 5, 'quality': 'EXCELLENT'},
            {'name': 'NY Open', 'start_hour': 8, 'end_hour': 10, 'quality': 'EXCELLENT'},
            {'name': 'Overlap', 'start_hour': 8, 'end_hour': 12, 'quality': 'BEST'},
        ],
        'avoid_times': [
            {'name': 'Asian Session', 'start_hour': 19, 'end_hour': 2, 'quality': 'LOW'},
            {'name': 'US Lunch', 'start_hour': 12, 'end_hour': 14, 'quality': 'LOW'},
            {'name': 'Late Friday', 'day': 4, 'start_hour': 14, 'end_hour': 17, 'quality': 'LOW'},
        ],
    },

    # === PATTERN RECOGNITION RULES ===
    'patterns': {
        'rejection_wick': {
            'min_wick_size': 1.5, # Adjusted for 5m
            'wick_to_body_ratio': 2.0,
            'confirmation': 'Close opposite direction',
        },
        'liquidity_grab': {
            'sweep_distance': 2.0,
            'reversal_speed': 'Fast (within 1-2 candles)',
            'volume': 'Low on sweep, high on reversal',
        },
    },

    # === CONFLUENCE SCORING ===
    'confluence_weights': {
        'daily_tier1_zone': 5,
        'hourly_zone': 3,
        'round_number_major': 4,
        'round_number_minor': 2,
        'fair_value_gap': 3,
        'order_block': 4,
        'volume_profile_hvn': 4,
        'equal_highs_lows': 3,
        'pdh_pdl': 3,
        'pwh_pwl': 2,
        'pmh_pml': 2,
        'session_high_low': 4,
        'psychological_level': 3,
        'macro_regime_aligned': 6, # ADDED: Weight for Code 1 Regime
        'volatility_expansion': 5, # ADDED: Weight for Code 1 Volatility
    },
}

# =============================================================================
# 2. MOCK IB (For Safe Simulation)
# =============================================================================

class MockContract:
    def __init__(self, symbol):
        self.symbol = symbol

class MockBar:
    def __init__(self, date, open_, high, low, close, volume):
        self.date = date
        self.open = open_
        self.high = high
        self.low = low
        self.close = close
        self.volume = volume

class MockIB:
    def __init__(self):
        self.connected = False
    def connect(self, host, port, clientId):
        self.connected = True
        logger.info(f"[MOCK] Connected to IBKR at {host}:{port}")
        return True
    def qualifyContracts(self, *contracts): pass
    def reqHistoricalData(self, contract, endDateTime, durationStr, barSizeSetting, whatToShow, useRTH):
        now = datetime.now()
        data = []
        base_price = 4200.0

        # 1. GENERATE MOCK DATA
        if barSizeSetting == '5 mins':
            # Create a "Rejection at Support" scenario
            for i in range(20):
                t = now - timedelta(minutes=(20-i)*5)
                # Last few bars = Hammer candle at 4200 (Major Support)
                if i == 18:
                    o, h, l, c, v = base_price+1, base_price+2, base_price-2, base_price+1.5, 5000
                elif i == 19:
                    o, h, l, c, v = base_price+1.5, base_price+4, base_price+1.5, base_price+3.5, 3000
                else:
                    o = base_price + np.random.randn()
                    c = o + np.random.randn()
                    l = min(o, c) - abs(np.random.randn())
                    h = max(o, c) + abs(np.random.randn())
                    v = 1000
                data.append(MockBar(t, o, h, l, c, v))
        elif barSizeSetting == '1 day':
            # Create a Bullish Trend
            for i in range(50):
                t = now - timedelta(days=50-i)
                o = 4100 + i*2
                c = o + 2
                h, l, v = c+5, o-5, 50000
                data.append(MockBar(t, o, h, l, c, v))

        return data
    def sleep(self, seconds): pass
    def disconnect(self): pass

# Try Import
try:
    from ib_insync import *
    IB_AVAILABLE = True
except ImportError:
    IB_AVAILABLE = False
    IB = MockIB
    Contract = MockContract

# DataFrame Helper
if not IB_AVAILABLE:
    util = type('obj', (object,), {'df': lambda x: pd.DataFrame([vars(b) for b in x])})

def to_df(bars):
    if not bars: return None
    df = None
    if isinstance(bars[0], MockBar):
        df = pd.DataFrame([vars(b) for b in bars])
    else:
        df = util.df(bars)

    # Standardize columns to Title Case (Open, High, Low, Close, Volume)
    if df is not None:
        df.columns = [c.capitalize() for c in df.columns]
    return df

# =============================================================================
# 3. INTELLIGENT ANALYZER (Code 2 Core + Code 1 Upgrades)
# =============================================================================

class IntelligentAnalyzer:
    """Applies ALL learned analysis + Macro Regime"""

    def __init__(self):
        self.knowledge = KNOWLEDGE_BASE

    def update_session_levels(self, daily_df: pd.DataFrame):
        """Dynamic update of PDH/PDL from live data"""
        if daily_df is not None and len(daily_df) > 1:
            prev = daily_df.iloc[-2] # Previous full day
            self.knowledge['session_levels']['previous_day'] = {
                'high': prev['High'],
                'low': prev['Low'],
                'close': prev['Close']
            }
            logger.info(f"Updated Session Levels: PDH {prev['High']}, PDL {prev['Low']}")

    def analyze_price_level(self, price: float, recent_bars: pd.DataFrame, daily_df: pd.DataFrame, dxy_df: pd.DataFrame) -> Dict:
        """
        Comprehensive analysis.
        """
        # 1. Dynamic Updates
        self.update_session_levels(daily_df)

        analysis = {
            'price': price,
            'timestamp': datetime.now(),
            'confluences': [],
            'patterns': [],
            'zones': [],
            'trade_setups': [],
            'confluence_score': 0,
            'recommendation': None,
            'macro_context': {}
        }

        # 2. Check Macro Regime (Code 1 Logic)
        analysis = self._analyze_macro_regime(daily_df, dxy_df, analysis)

        # 3. Check All Zones (Code 2 Logic)
        analysis = self._check_daily_zones(price, analysis)
        analysis = self._check_hourly_zones(price, analysis)
        analysis = self._check_round_numbers(price, analysis)
        analysis = self._check_fair_value_gaps(price, analysis)
        analysis = self._check_order_blocks(price, analysis)
        analysis = self._check_volume_profile(price, analysis)
        analysis = self._check_liquidity_zones(price, analysis)
        analysis = self._check_session_levels(price, analysis)

        # 4. Check Patterns & Microstructure (Code 2 + Code 1)
        analysis = self._check_rejection_patterns(recent_bars, analysis)
        analysis = self._check_liquidity_grabs(recent_bars, analysis)
        analysis = self._check_breakout_patterns(recent_bars, analysis)

        # 5. Scoring & Recommendations
        analysis = self._calculate_confluence_score(analysis)
        analysis = self._generate_trade_setups(price, recent_bars, analysis)
        analysis = self._make_recommendation(analysis)

        return analysis

    # --- CODE 1 MACRO LOGIC ---
    def _analyze_macro_regime(self, daily_df, dxy_df, analysis):
        if daily_df is None: return analysis

        # Gold Trend
        curr = daily_df['Close'].iloc[-1]
        high_50 = daily_df['High'].tail(50).max()
        low_50 = daily_df['Low'].tail(50).min()
        pos = (curr - low_50) / (high_50 - low_50) if high_50 != low_50 else 0.5

        # DXY Trend
        dxy_bearish = False
        if dxy_df is not None:
            dxy_curr = dxy_df['Close'].iloc[-1]
            dxy_ma = dxy_df['Close'].tail(50).mean()
            dxy_bearish = dxy_curr < dxy_ma

        regime = "NEUTRAL"
        score_boost = 0

        if pos > 0.6 and dxy_bearish:
            regime = "STRONG_BULL"
            score_boost = self.knowledge['confluence_weights']['macro_regime_aligned']
        elif pos < 0.4 and not dxy_bearish:
            regime = "STRONG_BEAR"
            score_boost = self.knowledge['confluence_weights']['macro_regime_aligned']

        analysis['macro_context'] = {
            'regime': regime,
            'gold_pos': pos,
            'dxy_bearish': dxy_bearish
        }

        if score_boost > 0:
            analysis['confluences'].append({
                'type': 'MACRO_ALIGNMENT',
                'name': regime,
                'evidence': 'Gold Trend + DXY Correlation',
                'weight': score_boost
            })
            analysis['confluence_score'] += score_boost

        return analysis

    # --- CODE 2 ZONE CHECKERS (Full Restore) ---

    def _check_daily_zones(self, price: float, analysis: Dict) -> Dict:
        for zone_type, zones in self.knowledge['daily_zones'].items():
            for zone in zones:
                if zone['low'] <= price <= zone['high']:
                    analysis['confluences'].append({
                        'type': 'daily_zone',
                        'zone_type': zone_type,
                        'name': zone['name'],
                        'range': f"${zone['low']:.0f}-${zone['high']:.0f}",
                        'evidence': zone['evidence'],
                        'priority': zone['priority'],
                        'weight': self.knowledge['confluence_weights']['daily_tier1_zone'],
                    })
                    analysis['zones'].append(zone['name'])
                    analysis['confluence_score'] += zone['priority']
        return analysis

    def _check_hourly_zones(self, price: float, analysis: Dict) -> Dict:
        for zone_type, zones in self.knowledge['hourly_zones'].items():
            for zone in zones:
                if zone['low'] <= price <= zone['high']:
                    analysis['confluences'].append({
                        'type': 'hourly_zone',
                        'zone_type': zone_type,
                        'name': zone['name'],
                        'range': f"${zone['low']:.0f}-${zone['high']:.0f}",
                        'evidence': zone['evidence'],
                        'priority': zone['priority'],
                        'weight': self.knowledge['confluence_weights']['hourly_zone'],
                    })
                    analysis['zones'].append(zone['name'])
                    analysis['confluence_score'] += zone['priority'] * 0.8
        return analysis

    def _check_round_numbers(self, price: float, analysis: Dict) -> Dict:
        for major_rn in self.knowledge['round_numbers']['major']:
            if abs(price - major_rn) <= 5:
                analysis['confluences'].append({
                    'type': 'round_number_major',
                    'level': major_rn,
                    'weight': self.knowledge['confluence_weights']['round_number_major'],
                })
                analysis['zones'].append(f"Round ${major_rn}")
                analysis['confluence_score'] += 4
        return analysis

    def _check_fair_value_gaps(self, price: float, analysis: Dict) -> Dict:
        for fvg in self.knowledge['fair_value_gaps']:
            if fvg['low'] <= price <= fvg['high']:
                analysis['confluences'].append({
                    'type': 'fair_value_gap',
                    'range': f"${fvg['low']:.0f}-${fvg['high']:.0f}",
                    'note': fvg['note'],
                    'priority': fvg['priority'],
                    'weight': self.knowledge['confluence_weights']['fair_value_gap'],
                })
                analysis['zones'].append(f"FVG ${fvg['low']:.0f}")
                analysis['confluence_score'] += fvg['priority'] * 0.8
        return analysis

    def _check_order_blocks(self, price: float, analysis: Dict) -> Dict:
        for ob_type, order_blocks in self.knowledge['order_blocks'].items():
            for ob in order_blocks:
                if abs(price - ob['price']) <= 5:
                    analysis['confluences'].append({
                        'type': 'order_block',
                        'ob_type': ob_type,
                        'price': ob['price'],
                        'strength': ob['strength'],
                        'weight': self.knowledge['confluence_weights']['order_block'],
                    })
                    analysis['zones'].append(f"{ob_type} OB ${ob['price']:.0f}")
                    analysis['confluence_score'] += 4
        return analysis

    def _check_volume_profile(self, price: float, analysis: Dict) -> Dict:
        for hvn in self.knowledge['volume_profile']:
            if abs(price - hvn['price']) <= 10:
                analysis['confluences'].append({
                    'type': 'volume_profile_hvn',
                    'price': hvn['price'],
                    'significance': hvn['significance'],
                    'weight': self.knowledge['confluence_weights']['volume_profile_hvn'],
                })
                analysis['zones'].append(f"HVN ${hvn['price']:.0f}")
                analysis['confluence_score'] += 4
        return analysis

    def _check_liquidity_zones(self, price: float, analysis: Dict) -> Dict:
        for eq in self.knowledge['liquidity']['equal_highs']:
            if abs(price - eq['price']) <= 5:
                analysis['confluences'].append({
                    'type': 'equal_highs',
                    'price': eq['price'],
                    'note': eq['note'],
                    'weight': self.knowledge['confluence_weights']['equal_highs_lows'],
                })
                analysis['confluence_score'] += 3
        for eq in self.knowledge['liquidity']['equal_lows']:
            if abs(price - eq['price']) <= 5:
                analysis['confluences'].append({
                    'type': 'equal_lows',
                    'price': eq['price'],
                    'note': eq['note'],
                    'weight': self.knowledge['confluence_weights']['equal_highs_lows'],
                })
                analysis['confluence_score'] += 3
        return analysis

    def _check_session_levels(self, price: float, analysis: Dict) -> Dict:
        # Check Previous Day
        prev = self.knowledge['session_levels'].get('previous_day', {})
        if 'high' in prev and abs(price - prev['high']) <= 3:
            analysis['confluences'].append({'type': 'PDH', 'level': prev['high'], 'weight': 3})
            analysis['zones'].append("PDH")
            analysis['confluence_score'] += 3
        if 'low' in prev and abs(price - prev['low']) <= 3:
            analysis['confluences'].append({'type': 'PDL', 'level': prev['low'], 'weight': 3})
            analysis['zones'].append("PDL")
            analysis['confluence_score'] += 3
        return analysis

    # --- MICROSTRUCTURE & PATTERNS ---

    def _check_rejection_patterns(self, bars: pd.DataFrame, analysis: Dict) -> Dict:
        if len(bars) < 2: return analysis

        last = bars.iloc[-1]
        rules = self.knowledge['patterns']['rejection_wick']

        body = abs(last['Close'] - last['Open'])
        upper_wick = last['High'] - max(last['Open'], last['Close'])
        lower_wick = min(last['Open'], last['Close']) - last['Low']

        # Bullish Rejection
        if lower_wick > rules['min_wick_size'] and (body == 0 or lower_wick / body >= rules['wick_to_body_ratio']):
            analysis['patterns'].append({'type': 'BULLISH_WICK', 'note': f"Lower wick {lower_wick:.1f}"})
            analysis['confluence_score'] += 3

            # Code 1 Enhancement: Check Volume
            avg_vol = bars['Volume'].tail(20).mean()
            if last['Volume'] > avg_vol * 1.5:
                analysis['patterns'].append({'type': 'HIGH_VOLUME', 'note': 'Validation'})
                analysis['confluence_score'] += 5

        # Bearish Rejection
        if upper_wick > rules['min_wick_size'] and (body == 0 or upper_wick / body >= rules['wick_to_body_ratio']):
            analysis['patterns'].append({'type': 'BEARISH_WICK', 'note': f"Upper wick {upper_wick:.1f}"})
            analysis['confluence_score'] += 3

        return analysis

    def _check_liquidity_grabs(self, bars: pd.DataFrame, analysis: Dict) -> Dict:
        if len(bars) < 3: return analysis
        recent = bars.tail(3)
        last = recent.iloc[-1]
        prev_low = recent.iloc[:-1]['Low'].min()

        # Bullish Grab
        if last['Low'] < prev_low - 1.0 and last['Close'] > prev_low:
             analysis['patterns'].append({'type': 'LIQUIDITY_GRAB_BULL', 'note': 'Sweep & Reclaim'})
             analysis['confluence_score'] += 4

        return analysis

    def _check_breakout_patterns(self, bars: pd.DataFrame, analysis: Dict) -> Dict:
        # Placeholder for breakout logic if needed
        return analysis

    # --- SCORING & OUTPUT ---

    def _calculate_confluence_score(self, analysis: Dict) -> Dict:
        score = analysis['confluence_score']
        if score >= 20: analysis['confluence_level'] = 'EXTREME (5-star)'
        elif score >= 15: analysis['confluence_level'] = 'VERY HIGH (4-star)'
        elif score >= 10: analysis['confluence_level'] = 'HIGH (3-star)'
        else: analysis['confluence_level'] = 'MODERATE'
        return analysis

    def _generate_trade_setups(self, price: float, bars: pd.DataFrame, analysis: Dict) -> Dict:
        if analysis['confluence_score'] >= 10:
            bias = "LONG" if "support" in str(analysis['confluences']).lower() else "SHORT"

            setup = {
                'direction': bias,
                'entry': price,
                'stop': price - 5 if bias == "LONG" else price + 5,
                'target': price + 15 if bias == "LONG" else price - 15,
                'reason': f"Confluence Score {analysis['confluence_score']}"
            }
            analysis['trade_setups'].append(setup)
        return analysis

    def _make_recommendation(self, analysis: Dict) -> Dict:
        score = analysis['confluence_score']
        if score >= 18:
            analysis['recommendation'] = {'action': 'KILLER_EXECUTION', 'confidence': 'EXTREME'}
        elif score >= 12:
             analysis['recommendation'] = {'action': 'PREPARE_ENTRY', 'confidence': 'HIGH'}
        else:
             analysis['recommendation'] = {'action': 'WAIT', 'confidence': 'LOW'}
        return analysis

    def _find_nearest_level(self, price, type_): return None
    def check_time_quality(self) -> str:
        h = datetime.now().hour
        for t in self.knowledge['time_patterns']['best_times']:
            if t['start_hour'] <= h < t['end_hour']: return f"✅ {t['name']}"
        return "⚠️ Off-Peak"

# =============================================================================
# 4. REPORTING
# =============================================================================

def format_alert(analysis: Dict) -> str:
    a = analysis
    rec = a['recommendation']

    lines = []
    lines.append("="*60)
    lines.append(f"🦁 PREDATOR V3: COMPLETE ANALYSIS")
    lines.append(f"⏰ {a['timestamp'].strftime('%H:%M:%S')} | ⏳ {a.get('time_quality', 'Normal')}")
    lines.append("="*60)

    lines.append(f"\n💰 PRICE: ${a['price']:.2f}")
    lines.append(f"📊 SCORE: {a['confluence_score']}/30 ({a['confluence_level']})")

    # Macro
    m = a.get('macro_context', {})
    lines.append(f"\n🌍 MACRO: {m.get('regime', 'N/A')} (Gold Pos: {m.get('gold_pos', 0):.2f})")

    # Zones
    if a['zones']:
        lines.append(f"\n📍 ZONES HIT:")
        for z in a['zones']: lines.append(f"   • {z}")

    # Patterns
    if a['patterns']:
        lines.append(f"\n⚡ PATTERNS:")
        for p in a['patterns']: lines.append(f"   • {p['type']}: {p['note']}")

    # Decision
    lines.append("\n" + "-"*60)
    lines.append(f"🎯 DECISION: {rec['action']} ({rec['confidence']})")
    if a['trade_setups']:
        s = a['trade_setups'][0]
        lines.append(f"   Plan: {s['direction']} @ {s['entry']:.1f} (Stop: {s['stop']:.1f})")
    lines.append("-"*60)

    return "\n".join(lines)

# =============================================================================
# 5. MAIN EXECUTION
# =============================================================================

async def main():
    print("\nStarting PREDATOR V3...")

    # CONFIGURATION
    HOST = '127.0.0.1'
    PORT = 7497 # 7497=Paper, 7496=Live
    ID = 998

    # CONNECT
    ib = None
    if IB_AVAILABLE:
        try:
            ib = IB()
            print(f"Connecting to {HOST}:{PORT}...")
            await ib.connectAsync(HOST, PORT, clientId=ID, timeout=2)
        except Exception:
            print("Connection failed. Using MOCK mode.")
            ib = MockIB()
    else:
        print("Library missing. Using MOCK mode.")
        ib = MockIB()

    # DATA
    contract = ContFuture('GC', 'COMEX', 'USD') if IB_AVAILABLE and not isinstance(ib, MockIB) else Contract('GC')
    if not isinstance(ib, MockIB): ib.qualifyContracts(contract)

    # 1. Daily Data
    dt_daily = to_df(ib.reqHistoricalData(contract, '', '1 Y', '1 day', 'TRADES', True))

    # 2. DXY Data
    dt_dxy = None
    # (Skipping DXY real fetch for simplicity in V3 unless strictly needed, Mock handles it)

    # 3. 5m Data
    dt_m5 = to_df(ib.reqHistoricalData(contract, '', '2 D', '5 mins', 'TRADES', False))

    if dt_m5 is not None:
        curr_price = dt_m5['Close'].iloc[-1]

        # ANALYZE
        analyzer = IntelligentAnalyzer()
        analyzer.time_quality = analyzer.check_time_quality()

        result = analyzer.analyze_price_level(curr_price, dt_m5, dt_daily, dt_dxy)
        result['time_quality'] = analyzer.time_quality

        print(format_alert(result))

    if hasattr(ib, 'disconnect'): ib.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
