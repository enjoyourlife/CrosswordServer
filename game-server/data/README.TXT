
#include <ctype.h>
#include <xstring>
using namespace std;
/* {{{ php_htoi
 */
static int php_htoi(char *s)
{
	int value;
	int c;

	c = ((unsigned char *)s)[0];
	if (isupper(c))
		c = tolower(c);
	value = (c >= '0' && c <= '9' ? c - '0' : c - 'a' + 10) * 16;

	c = ((unsigned char *)s)[1];
	if (isupper(c))
		c = tolower(c);
	value += c >= '0' && c <= '9' ? c - '0' : c - 'a' + 10;

	return (value);
}
/* }}} */

/* {{{ URL解码，提取自PHP 5.2.17
   用法：string urldecode(string str_source)
   时间：2012-8-14 By Dewei
*/
string urldecode(string &str_source)
{
	char const *in_str = str_source.c_str();
	int in_str_len = strlen(in_str);
	int out_str_len = 0;
	string out_str;
	char *str;

	str = _strdup(in_str);
	char *dest = str;
	char *data = str;

	while (in_str_len--) {
		if (*data == '+') {
			*dest = ' ';
		}
		else if (*data == '%' && in_str_len >= 2 && isxdigit((int) *(data + 1)) 
			&& isxdigit((int) *(data + 2))) {
				*dest = (char) php_htoi(data + 1);
				data += 2;
				in_str_len -= 2;
		} else {
			*dest = *data;
		}
		data++;
		dest++;
	}
	*dest = '\0';
	out_str_len =  dest - str;
	out_str = str;
	free(str);
    return out_str;
}
/* }}} */

/* {{{ URL编码，提取自PHP 
   用法：string urlencode(string str_source)
   说明：仅不编码 -_. 其余全部编码，空格会被编码为 +
   时间：2012-8-13 By Dewei
*/
string urlencode(string &str_source)
{
	char const *in_str = str_source.c_str();
	int in_str_len = strlen(in_str);
	int out_str_len = 0;
	string out_str;
	register unsigned char c;
	unsigned char *to, *start;
	unsigned char const *from, *end;
	unsigned char hexchars[] = "0123456789ABCDEF";

	from = (unsigned char *)in_str;
	end = (unsigned char *)in_str + in_str_len;
	start = to = (unsigned char *) malloc(3*in_str_len+1);

	while (from < end) {
		c = *from++;

		if (c == ' ') {
			*to++ = '+';
		} else if ((c < '0' && c != '-' && c != '.') ||
			(c < 'A' && c > '9') ||
			(c > 'Z' && c < 'a' && c != '_') ||
			(c > 'z')) { 
				to[0] = '%';
				to[1] = hexchars[c >> 4];
				to[2] = hexchars[c & 15];
				to += 3;
		} else {
			*to++ = c;
		}
	}
	*to = 0;

	out_str_len = to - start;
	out_str = (char *) start;
	free(start);
	return out_str;
}
/* }}} */