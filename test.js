// $digest = DigestCalculator::calculateDigest( $documentHash, HashType::SHA256 );
// $twoRightmostBytes = substr( $digest, -2 );
// $positiveInteger = unpack( 'n*', $twoRightmostBytes )[1];
// return str_pad( substr( ( $positiveInteger % 10000 ), -4 ), 4, '0', STR_PAD_LEFT );

const crypto = require('crypto')
// const hash = crypto.randomBytes(32).toString('hex')
const hash = 'c41c86b16bcdd57f18a2a501f7d6452c7e9a0a485a9fa8aca5808d9631ad9d2b'

const digest = crypto.createHash('sha512').update(hash).digest('base64')
const sha256HashedInput = crypto.createHash('sha256').update(Buffer.from(digest, 'base64')).digest()
const integer = sha256HashedInput.readUIntBE(sha256HashedInput.length - 2, 2)
const verificationCode = String((integer % 10000).toString()).padStart(4, '0')

// const sha256 = crypto.createHash('sha256').update(hash)
// const sha256nin = sha256.digest('binary')
// const sha256ninBuffer = Buffer.from(sha256nin, 'binary')
// const binArray = []

// for (const v of sha256ninBuffer.values()) {
//   binArray.push(v.toString(2).padStart(8, '0'))
// }

// const binString = binArray.join('')
// const binStringRightmost = binString.substr(-16)
// const binStringRightmostInt = parseInt(binStringRightmost, 2)
// const consent = String(binStringRightmostInt % 10000).padStart(4, '0')


console.log(verificationCode)
