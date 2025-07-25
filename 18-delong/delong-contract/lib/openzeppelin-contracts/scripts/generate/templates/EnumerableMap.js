const format = require('../format-lines');
const { fromBytes32, toBytes32 } = require('./conversion');
const { MAP_TYPES } = require('./Enumerable.opts');

const header = `\
pragma solidity ^0.8.20;

import {EnumerableSet} from "./EnumerableSet.sol";

/**
 * @dev Library for managing an enumerable variant of Solidity's
 * https://solidity.readthedocs.io/en/latest/types.html#mapping-types[\`mapping\`]
 * type.
 *
 * Maps have the following properties:
 *
 * - Entries are added, removed, and checked for existence in constant time
 * (O(1)).
 * - Entries are enumerated in O(n). No guarantees are made on the ordering.
 * - Map can be cleared (all entries removed) in O(n).
 *
 * \`\`\`solidity
 * contract Example {
 *     // Add the library methods
 *     using EnumerableMap for EnumerableMap.UintToAddressMap;
 *
 *     // Declare a set state variable
 *     EnumerableMap.UintToAddressMap private myMap;
 * }
 * \`\`\`
 *
 * The following map types are supported:
 *
 * - \`uint256 -> address\` (\`UintToAddressMap\`) since v3.0.0
 * - \`address -> uint256\` (\`AddressToUintMap\`) since v4.6.0
 * - \`bytes32 -> bytes32\` (\`Bytes32ToBytes32Map\`) since v4.6.0
 * - \`uint256 -> uint256\` (\`UintToUintMap\`) since v4.7.0
 * - \`bytes32 -> uint256\` (\`Bytes32ToUintMap\`) since v4.7.0
 * - \`uint256 -> bytes32\` (\`UintToBytes32Map\`) since v5.1.0
 * - \`address -> address\` (\`AddressToAddressMap\`) since v5.1.0
 * - \`address -> bytes32\` (\`AddressToBytes32Map\`) since v5.1.0
 * - \`bytes32 -> address\` (\`Bytes32ToAddressMap\`) since v5.1.0
 * - \`bytes -> bytes\` (\`BytesToBytesMap\`) since v5.4.0
 *
 * [WARNING]
 * ====
 * Trying to delete such a structure from storage will likely result in data corruption, rendering the structure
 * unusable.
 * See https://github.com/ethereum/solidity/pull/11843[ethereum/solidity#11843] for more info.
 *
 * In order to clean an EnumerableMap, you can either remove all elements one by one or create a fresh instance using an
 * array of EnumerableMap.
 * ====
 */
`;

const defaultMap = `\
// To implement this library for multiple types with as little code repetition as possible, we write it in
// terms of a generic Map type with bytes32 keys and values. The Map implementation uses private functions,
// and user-facing implementations such as \`UintToAddressMap\` are just wrappers around the underlying Map.
// This means that we can only create new EnumerableMaps for types that fit in bytes32.

/**
 * @dev Query for a nonexistent map key.
 */
error EnumerableMapNonexistentKey(bytes32 key);

struct Bytes32ToBytes32Map {
    // Storage of keys
    EnumerableSet.Bytes32Set _keys;
    mapping(bytes32 key => bytes32) _values;
}

/**
 * @dev Adds a key-value pair to a map, or updates the value for an existing
 * key. O(1).
 *
 * Returns true if the key was added to the map, that is if it was not
 * already present.
 */
function set(Bytes32ToBytes32Map storage map, bytes32 key, bytes32 value) internal returns (bool) {
    map._values[key] = value;
    return map._keys.add(key);
}

/**
 * @dev Removes a key-value pair from a map. O(1).
 *
 * Returns true if the key was removed from the map, that is if it was present.
 */
function remove(Bytes32ToBytes32Map storage map, bytes32 key) internal returns (bool) {
    delete map._values[key];
    return map._keys.remove(key);
}

/**
 * @dev Removes all the entries from a map. O(n).
 *
 * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
 * function uncallable if the map grows to the point where clearing it consumes too much gas to fit in a block.
 */
function clear(Bytes32ToBytes32Map storage map) internal {
    uint256 len = length(map);
    for (uint256 i = 0; i < len; ++i) {
        delete map._values[map._keys.at(i)];
    }
    map._keys.clear();
}

/**
 * @dev Returns true if the key is in the map. O(1).
 */
function contains(Bytes32ToBytes32Map storage map, bytes32 key) internal view returns (bool) {
    return map._keys.contains(key);
}

/**
 * @dev Returns the number of key-value pairs in the map. O(1).
 */
function length(Bytes32ToBytes32Map storage map) internal view returns (uint256) {
    return map._keys.length();
}

/**
 * @dev Returns the key-value pair stored at position \`index\` in the map. O(1).
 *
 * Note that there are no guarantees on the ordering of entries inside the
 * array, and it may change when more entries are added or removed.
 *
 * Requirements:
 *
 * - \`index\` must be strictly less than {length}.
 */
function at(Bytes32ToBytes32Map storage map, uint256 index) internal view returns (bytes32 key, bytes32 value) {
    bytes32 atKey = map._keys.at(index);
    return (atKey, map._values[atKey]);
}

/**
 * @dev Tries to return the value associated with \`key\`. O(1).
 * Does not revert if \`key\` is not in the map.
 */
function tryGet(Bytes32ToBytes32Map storage map, bytes32 key) internal view returns (bool exists, bytes32 value) {
    bytes32 val = map._values[key];
    if (val == bytes32(0)) {
        return (contains(map, key), bytes32(0));
    } else {
        return (true, val);
    }
}

/**
 * @dev Returns the value associated with \`key\`. O(1).
 *
 * Requirements:
 *
 * - \`key\` must be in the map.
 */
function get(Bytes32ToBytes32Map storage map, bytes32 key) internal view returns (bytes32) {
    bytes32 value = map._values[key];
    if (value == 0 && !contains(map, key)) {
        revert EnumerableMapNonexistentKey(key);
    }
    return value;
}

/**
 * @dev Returns an array containing all the keys
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function keys(Bytes32ToBytes32Map storage map) internal view returns (bytes32[] memory) {
    return map._keys.values();
}

/**
 * @dev Returns an array containing a slice of the keys
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function keys(Bytes32ToBytes32Map storage map, uint256 start, uint256 end) internal view returns (bytes32[] memory) {
    return map._keys.values(start, end);
}
`;

const customMap = ({ name, key, value }) => `\
// ${name}

struct ${name} {
    Bytes32ToBytes32Map _inner;
}

/**
 * @dev Adds a key-value pair to a map, or updates the value for an existing
 * key. O(1).
 *
 * Returns true if the key was added to the map, that is if it was not
 * already present.
 */
function set(${name} storage map, ${key.type} key, ${value.type} value) internal returns (bool) {
    return set(map._inner, ${toBytes32(key.type, 'key')}, ${toBytes32(value.type, 'value')});
}

/**
 * @dev Removes a value from a map. O(1).
 *
 * Returns true if the key was removed from the map, that is if it was present.
 */
function remove(${name} storage map, ${key.type} key) internal returns (bool) {
    return remove(map._inner, ${toBytes32(key.type, 'key')});
}

/**
 * @dev Removes all the entries from a map. O(n).
 *
 * WARNING: This function has an unbounded cost that scales with map size. Developers should keep in mind that
 * using it may render the function uncallable if the map grows to the point where clearing it consumes too much
 * gas to fit in a block.
 */
function clear(${name} storage map) internal {
    clear(map._inner);
}

/**
 * @dev Returns true if the key is in the map. O(1).
 */
function contains(${name} storage map, ${key.type} key) internal view returns (bool) {
    return contains(map._inner, ${toBytes32(key.type, 'key')});
}

/**
 * @dev Returns the number of elements in the map. O(1).
 */
function length(${name} storage map) internal view returns (uint256) {
    return length(map._inner);
}

/**
 * @dev Returns the element stored at position \`index\` in the map. O(1).
 * Note that there are no guarantees on the ordering of values inside the
 * array, and it may change when more values are added or removed.
 *
 * Requirements:
 *
 * - \`index\` must be strictly less than {length}.
 */
function at(${name} storage map, uint256 index) internal view returns (${key.type} key, ${value.type} value) {
    (bytes32 atKey, bytes32 val) = at(map._inner, index);
    return (${fromBytes32(key.type, 'atKey')}, ${fromBytes32(value.type, 'val')});
}

/**
 * @dev Tries to return the value associated with \`key\`. O(1).
 * Does not revert if \`key\` is not in the map.
 */
function tryGet(${name} storage map, ${key.type} key) internal view returns (bool exists, ${value.type} value) {
    (bool success, bytes32 val) = tryGet(map._inner, ${toBytes32(key.type, 'key')});
    return (success, ${fromBytes32(value.type, 'val')});
}

/**
 * @dev Returns the value associated with \`key\`. O(1).
 *
 * Requirements:
 *
 * - \`key\` must be in the map.
 */
function get(${name} storage map, ${key.type} key) internal view returns (${value.type}) {
    return ${fromBytes32(value.type, `get(map._inner, ${toBytes32(key.type, 'key')})`)};
}

/**
 * @dev Returns an array containing all the keys
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function keys(${name} storage map) internal view returns (${key.type}[] memory) {
    bytes32[] memory store = keys(map._inner);
    ${key.type}[] memory result;

    assembly ("memory-safe") {
        result := store
    }

    return result;
}

/**
 * @dev Returns an array containing a slice of the keys
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function keys(${name} storage map, uint256 start, uint256 end) internal view returns (${key.type}[] memory) {
    bytes32[] memory store = keys(map._inner, start, end);
    ${key.type}[] memory result;

    assembly ("memory-safe") {
        result := store
    }

    return result;
}
`;

const memoryMap = ({ name, keySet, key, value }) => `\
/**
 * @dev Query for a nonexistent map key.
 */
error EnumerableMapNonexistent${key.name}Key(${key.type} key);

struct ${name} {
    // Storage of keys
    EnumerableSet.${keySet.name} _keys;
    mapping(${key.type} key => ${value.type}) _values;
}

/**
 * @dev Adds a key-value pair to a map, or updates the value for an existing
 * key. O(1).
 *
 * Returns true if the key was added to the map, that is if it was not
 * already present.
 */
function set(${name} storage map, ${key.typeLoc} key, ${value.typeLoc} value) internal returns (bool) {
    map._values[key] = value;
    return map._keys.add(key);
}

/**
 * @dev Removes a key-value pair from a map. O(1).
 *
 * Returns true if the key was removed from the map, that is if it was present.
 */
function remove(${name} storage map, ${key.typeLoc} key) internal returns (bool) {
    delete map._values[key];
    return map._keys.remove(key);
}

/**
 * @dev Removes all the entries from a map. O(n).
 *
 * WARNING: Developers should keep in mind that this function has an unbounded cost and using it may render the
 * function uncallable if the map grows to the point where clearing it consumes too much gas to fit in a block.
 */
function clear(${name} storage map) internal {
    uint256 len = length(map);
    for (uint256 i = 0; i < len; ++i) {
        delete map._values[map._keys.at(i)];
    }
    map._keys.clear();
}

/**
 * @dev Returns true if the key is in the map. O(1).
 */
function contains(${name} storage map, ${key.typeLoc} key) internal view returns (bool) {
    return map._keys.contains(key);
}

/**
 * @dev Returns the number of key-value pairs in the map. O(1).
 */
function length(${name} storage map) internal view returns (uint256) {
    return map._keys.length();
}

/**
 * @dev Returns the key-value pair stored at position \`index\` in the map. O(1).
 *
 * Note that there are no guarantees on the ordering of entries inside the
 * array, and it may change when more entries are added or removed.
 *
 * Requirements:
 *
 * - \`index\` must be strictly less than {length}.
 */
function at(
    ${name} storage map,
    uint256 index
) internal view returns (${key.typeLoc} key, ${value.typeLoc} value) {
    key = map._keys.at(index);
    value = map._values[key];
}

/**
 * @dev Tries to return the value associated with \`key\`. O(1).
 * Does not revert if \`key\` is not in the map.
 */
function tryGet(
    ${name} storage map,
    ${key.typeLoc} key
) internal view returns (bool exists, ${value.typeLoc} value) {
    value = map._values[key];
    exists = ${value.memory ? 'bytes(value).length != 0' : `value != ${value.type}(0)`} || contains(map, key);
}

/**
 * @dev Returns the value associated with \`key\`. O(1).
 *
 * Requirements:
 *
 * - \`key\` must be in the map.
 */
function get(${name} storage map, ${key.typeLoc} key) internal view returns (${value.typeLoc} value) {
    bool exists;
    (exists, value) = tryGet(map, key);
    if (!exists) {
        revert EnumerableMapNonexistent${key.name}Key(key);
    }
}

/**
 * @dev Returns an array containing all the keys
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function keys(${name} storage map) internal view returns (${key.type}[] memory) {
    return map._keys.values();
}

/**
 * @dev Returns an array containing a slice of the keys
 *
 * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
 * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
 * this function has an unbounded cost, and using it as part of a state-changing function may render the function
 * uncallable if the map grows to a point where copying to memory consumes too much gas to fit in a block.
 */
function keys(${name} storage map, uint256 start, uint256 end) internal view returns (${key.type}[] memory) {
    return map._keys.values(start, end);
}
`;

// GENERATE
module.exports = format(
  header.trimEnd(),
  'library EnumerableMap {',
  format(
    [].concat(
      'using EnumerableSet for *;',
      '',
      defaultMap,
      MAP_TYPES.filter(({ key, value }) => !(key.memory || value.memory)).map(customMap),
      MAP_TYPES.filter(({ key, value }) => key.memory || value.memory).map(memoryMap),
    ),
  ).trimEnd(),
  '}',
);
