import heapq
import struct
import math
from typing import Dict, List, Tuple, Any, Optional

class HuffmanNode:
    def __init__(
        self,
        symbol: Optional[int],
        freq: int,
        min_symbol: int = 0,
        left: Optional["HuffmanNode"] = None,
        right: Optional["HuffmanNode"] = None
    ):
        self.symbol = symbol  # None for internal nodes, 0-255 for leaf
        self.freq = freq
        self.min_symbol = min_symbol  # Deterministic secondary key for heaps
        self.left = left
        self.right = right

    def __lt__(self, other: "HuffmanNode") -> bool:
        if self.freq != other.freq:
            return self.freq < other.freq
        return self.min_symbol < other.min_symbol

    def is_leaf(self) -> bool:
        return self.symbol is not None


class HuffmanCoder:
    MAGIC = b"IL_HUF1"

    @staticmethod
    def calculate_frequency_table(data: bytes) -> Dict[int, int]:
        freqs: Dict[int, int] = {}
        for byte_val in data:
            freqs[byte_val] = freqs.get(byte_val, 0) + 1
        return freqs

    @staticmethod
    def calculate_shannon_entropy(freq_table: Dict[int, int], total_count: int) -> float:
        if total_count == 0:
            return 0.0
        entropy = 0.0
        for freq in freq_table.values():
            p = freq / total_count
            if p > 0:
                entropy -= p * math.log2(p)
        return float(entropy)

    @classmethod
    def build_tree(cls, freq_table: Dict[int, int]) -> Optional[HuffmanNode]:
        if not freq_table:
            return None
            
        heap: List[HuffmanNode] = []
        # Crucial for canonical determinism: sort keys consistently
        for symbol in sorted(freq_table.keys()):
            freq = freq_table[symbol]
            heapq.heappush(heap, HuffmanNode(symbol, freq, min_symbol=symbol))

        # Handle edge case with only 1 unique symbol
        if len(heap) == 1:
            only = heapq.heappop(heap)
            return HuffmanNode(None, only.freq, min_symbol=only.min_symbol, left=only, right=None)

        while len(heap) > 1:
            left = heapq.heappop(heap)
            right = heapq.heappop(heap)
            min_sym = min(left.min_symbol, right.min_symbol)
            parent = HuffmanNode(
                None,
                left.freq + right.freq,
                min_symbol=min_sym,
                left=left,
                right=right
            )
            heapq.heappush(heap, parent)

        return heap[0]

    @classmethod
    def generate_codes(cls, root: Optional[HuffmanNode]) -> Dict[int, str]:
        codes: Dict[int, str] = {}
        if not root:
            return codes

        def _traverse(node: HuffmanNode, current_code: str):
            if node.is_leaf():
                codes[node.symbol] = current_code or "0"
                return
            if node.left:
                _traverse(node.left, current_code + "0")
            if node.right:
                _traverse(node.right, current_code + "1")

        _traverse(root, "")
        return codes

    @classmethod
    def encode_data(cls, data: bytes, codes: Dict[int, str]) -> Tuple[bytes, int]:
        """Packs variable length bit strings into byte array."""
        bit_buffer = []
        for b in data:
            bit_buffer.append(codes[b])
        full_bit_str = "".join(bit_buffer)
        total_bits = len(full_bit_str)

        packed = bytearray()
        for i in range(0, total_bits, 8):
            chunk = full_bit_str[i:i+8]
            if len(chunk) < 8:
                chunk = chunk.ljust(8, '0')
            packed.append(int(chunk, 2))

        return bytes(packed), total_bits

    @classmethod
    def serialize_artifact(
        cls,
        data: bytes,
        freq_table: Dict[int, int],
        codes: Dict[int, str],
        packed_bytes: bytes,
        total_bits: int
    ) -> bytes:
        """
        Creates a standalone, self-extracting .huf binary container:
        [Magic: 7 bytes (IL_HUF1)]
        [Original Length: 4 bytes uint32]
        [Total Valid Bits: 4 bytes uint32]
        [Num Unique Symbols: 2 bytes uint16]
        [Table Entries: N * (1 byte symbol + 4 bytes frequency)]
        [Packed Payload Bytes]
        """
        header = bytearray()
        header.extend(cls.MAGIC)
        orig_len = len(data)
        num_symbols = len(freq_table)
        header.extend(struct.pack(">IIH", orig_len, total_bits, num_symbols))

        for symbol, freq in sorted(freq_table.items()):
            header.extend(struct.pack(">BI", symbol, freq))

        return bytes(header) + packed_bytes

    @classmethod
    def deserialize_and_decode(cls, artifact_bytes: bytes) -> bytes:
        magic_len = len(cls.MAGIC)
        if artifact_bytes[:magic_len] != cls.MAGIC:
            raise ValueError("Invalid Huffman artifact magic bytes.")

        offset = magic_len
        orig_len, total_bits, num_symbols = struct.unpack_from(">IIH", artifact_bytes, offset)
        offset += struct.calcsize(">IIH")

        freq_table: Dict[int, int] = {}
        for _ in range(num_symbols):
            sym, freq = struct.unpack_from(">BI", artifact_bytes, offset)
            offset += struct.calcsize(">BI")
            freq_table[sym] = freq

        packed_bytes = artifact_bytes[offset:]

        # Reconstruct canonical Huffman Tree from frequency table
        root = cls.build_tree(freq_table)
        if not root:
            return b""

        bit_chunks = []
        for byte_val in packed_bytes:
            bit_chunks.append(f"{byte_val:08b}")
        bit_str = "".join(bit_chunks)[:total_bits]

        decoded = bytearray()
        current_node = root
        for bit in bit_str:
            if bit == "0":
                current_node = current_node.left if current_node.left else current_node
            else:
                current_node = current_node.right if current_node.right else current_node

            if current_node.is_leaf():
                decoded.append(current_node.symbol)
                current_node = root

        if len(decoded) != orig_len:
            raise ValueError(f"Decompressed length mismatch: expected {orig_len}, got {len(decoded)}")

        return bytes(decoded)

    @classmethod
    def analyze(cls, data: bytes) -> Dict[str, Any]:
        """Comprehensive information-theoretic analysis of raw data."""
        total_symbols = len(data)
        if total_symbols == 0:
            return {
                "total_symbols": 0,
                "unique_symbols": 0,
                "shannon_entropy": 0.0,
                "avg_code_length": 0.0,
                "coding_efficiency": 0.0,
                "redundancy": 0.0,
                "theoretical_min_bits": 0,
                "actual_encoded_bits": 0,
                "artifact_size_bytes": 0,
                "compression_ratio": 1.0,
                "symbol_table": []
            }

        freq_table = cls.calculate_frequency_table(data)
        shannon_entropy = cls.calculate_shannon_entropy(freq_table, total_symbols)
        root = cls.build_tree(freq_table)
        codes = cls.generate_codes(root)

        packed_bytes, total_bits = cls.encode_data(data, codes)
        artifact = cls.serialize_artifact(data, freq_table, codes, packed_bytes, total_bits)

        avg_code_length = sum((freq / total_symbols) * len(codes[sym]) for sym, freq in freq_table.items())
        redundancy = max(0.0, avg_code_length - shannon_entropy)
        efficiency = (shannon_entropy / avg_code_length * 100.0) if avg_code_length > 0 else 100.0
        theoretical_min_bits = round(shannon_entropy * total_symbols)

        symbol_table = []
        for sym, freq in sorted(freq_table.items(), key=lambda x: x[1], reverse=True)[:64]:
            p = freq / total_symbols
            code = codes[sym]
            symbol_table.append({
                "symbol": sym,
                "char": chr(sym) if 32 <= sym <= 126 else f"0x{sym:02X}",
                "frequency": freq,
                "probability": round(p, 5),
                "code": code,
                "code_length": len(code)
            })

        return {
            "total_symbols": total_symbols,
            "unique_symbols": len(freq_table),
            "shannon_entropy": round(shannon_entropy, 4),
            "avg_code_length": round(avg_code_length, 4),
            "redundancy": round(redundancy, 4),
            "coding_efficiency": round(efficiency, 2),
            "theoretical_min_bits": theoretical_min_bits,
            "actual_encoded_bits": total_bits,
            "artifact_size_bytes": len(artifact),
            "compression_ratio": round(total_symbols / len(artifact), 4) if len(artifact) > 0 else 0.0,
            "symbol_table": symbol_table
        }
