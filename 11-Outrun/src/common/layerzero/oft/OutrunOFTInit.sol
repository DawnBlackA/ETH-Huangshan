// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import { IOFT, OutrunOFTCoreInit } from "./OutrunOFTCoreInit.sol";
import { OutrunERC20Init } from "../../../common/OutrunERC20Init.sol";

/**
 * @title Outrun OFT Init Contract (Just for minimal proxy)
 * @dev OFT is an ERC-20 token that extends the functionality of the OFTCore contract.
 */
abstract contract OutrunOFTInit is OutrunOFTCoreInit, OutrunERC20Init {
    /**
     * @dev Constructor for the OFT contract.
     * @param _lzEndpoint The local LayerZero endpoint address.
     */
    constructor(address _lzEndpoint) OutrunOFTCoreInit(decimals(), _lzEndpoint) {}

    /**
     * @dev Initializes the OFT with the provided name, symbol, and delegate.
     * @param _name The name of the OFT.
     * @param _symbol The symbol of the OFT.
     * @param _delegate The delegate capable of making OApp configurations inside of the endpoint.
     *
     * @dev The delegate typically should be set as the owner of the contract.
     * @dev Ownable is not initialized here on purpose. It should be initialized in the child contract to
     * accommodate the different version of Ownable.
     */
    function __OutrunOFT_init(
        string memory _name,
        string memory _symbol,
        address _delegate
    ) internal onlyInitializing {
        __OutrunERC20_init(_name, _symbol);
        __OutrunOFTCore_init(_delegate);
    }

    function __OFT_init_unchained() internal onlyInitializing {}

    /**
     * @dev Retrieves the address of the underlying ERC20 implementation.
     * @return The address of the OFT token.
     *
     * @dev In the case of OFT, address(this) and erc20 are the same contract.
     */
    function token() public view returns (address) {
        return address(this);
    }

    /**
     * @notice Indicates whether the OFT contract requires approval of the 'token()' to send.
     * @return requiresApproval Needs approval of the underlying token implementation.
     *
     * @dev In the case of OFT where the contract IS the token, approval is NOT required.
     */
    function approvalRequired() external pure virtual returns (bool) {
        return false;
    }


    /**
     * @dev Withdraw OFT if the composition call has not been executed.
     * @param guid - The unique identifier for the received LayerZero message.
     * @param receiver - Address to receive OFT.
     * @return amount - Withdraw amount
     */
    function withdrawIfNotExecuted(bytes32 guid, address receiver) external override returns (uint256 amount) {
        ComposeTxStatus storage txStatus = _getOFTCoreStorage().composeTxs[guid];
        require(!txStatus.isExecuted, AlreadyExecuted());
        require(msg.sender == txStatus.UBO, PermissionDenied());
        
        txStatus.isExecuted = true;

        amount = txStatus.amount;
        address composer = txStatus.composer;
        _update(composer, receiver, amount);

        emit WithdrawIfNotExecuted(guid, composer, receiver, amount);
    }

    /**
     * @dev Burns tokens from the sender's specified balance.
     * @param _from The address to debit the tokens from.
     * @param _amountLD The amount of tokens to send in local decimals.
     * @param _minAmountLD The minimum amount to send in local decimals.
     * @param _dstEid The destination chain ID.
     * @return amountSentLD The amount sent in local decimals.
     * @return amountReceivedLD The amount received in local decimals on the remote.
     */
    function _debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        (amountSentLD, amountReceivedLD) = _debitView(_amountLD, _minAmountLD, _dstEid);

        // @dev In NON-default OFT, amountSentLD could be 100, with a 10% fee, the amountReceivedLD amount is 90,
        // therefore amountSentLD CAN differ from amountReceivedLD.

        // @dev Default OFT burns on src.
        _burn(_from, amountSentLD);
    }

    /**
     * @dev Credits tokens to the specified address.
     * @param _to The address to credit the tokens to.
     * @param _amountLD The amount of tokens to credit in local decimals.
     * @dev _srcEid The source chain ID.
     * @return amountReceivedLD The amount of tokens ACTUALLY received in local decimals.
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 /*_srcEid*/
    ) internal virtual override returns (uint256 amountReceivedLD) {
        if (_to == address(0x0)) _to = address(0xdead); // _mint(...) does not support address(0x0)
        // @dev Default OFT mints on dst.
        _mint(_to, _amountLD);
        // @dev In the case of NON-default OFT, the _amountLD MIGHT not be == amountReceivedLD.
        return _amountLD;
    }
}
